import { Router, Status } from 'oak'
import { defineRoute } from './_common.ts'
import { withDBConnection, VibecampDBClient } from '../../utils/db.ts'
import { Tables } from '../../types/db-types.ts'
import env from '../../env.ts'
import dayjs from '../../utils/dayjs.ts'
import { escapeHtml, given } from '../../utils/misc.ts'
import { icsCalendar } from '../../utils/ics.ts'
import { avNeedsEmail, sendMail } from '../../utils/mailgun.ts'

const UTC_OFFSET_MINUTES = dayjs().utcOffset()

export const stringifyDate = (date: Date) =>
  dayjs.utc(date).add(UTC_OFFSET_MINUTES, 'minutes').toISOString()

const stringifyStartAndEndDates = <T extends Tables['event']>(
  event: T,
): Omit<T, 'start_datetime' | 'end_datetime'> & {
  start_datetime: string
  end_datetime: string | null
} => ({
  ...event,
  start_datetime: stringifyDate(event.start_datetime),
  end_datetime: given(event.end_datetime, stringifyDate) ?? null,
})

export default function register(router: Router) {
  defineRoute(router, {
    endpoint: '/events',
    method: 'get',
    handler: async () => {
      const events = await getAllEvents()

      return [
        {
          events
        },
        Status.OK,
      ]
    },
  })

  router.get('/events.ics', async (ctx) => {
    const allEvents = await getAllEvents()

    ctx.response.type = 'text/calendar'
    ctx.response.headers.append('Content-Disposition', 'inline; filename="events.ics"')

    const account_id = ctx.request.url.searchParams.get('account_id') as Tables['account']['account_id'] | undefined

    if (account_id) {
      const bookmarks = await withDBConnection(db => db.queryTable('event_bookmark', { where: ['account_id', '=', account_id] }))
      const bookmarkedEvents = new Set(bookmarks.map(b => b.event_id))
      ctx.response.body = icsCalendar('Vibecamp Bookmarked Events', allEvents.filter(event => bookmarkedEvents.has(event.event_id)))
    } else {
      ctx.response.body = icsCalendar('Vibecamp Event Schedule', allEvents)
    }

    ctx.response.status = Status.OK
  })

  // HACK: The front-end currently has a bug where events sometimes get saved
  // twice. This is creating duplicate events in the database. For now, we'll
  // just detect and prevent duplicate requests.
  const recentlySavedEventsJson = new Set<string>()
  setInterval(() => {
    recentlySavedEventsJson.clear()
  }, 1_000)

  defineRoute(router, {
    endpoint: '/event/save',
    method: 'post',
    requireAuth: true,
    handler: async ({ jwt: { account_id }, body: { event } }) => {
      const { event_id } = event

      {
        const eventJson = JSON.stringify(event)
        if (recentlySavedEventsJson.has(eventJson)) {
          return [null, Status.OK] // this event was already saved a second ago
        } else {
          recentlySavedEventsJson.add(eventJson)
        }
      }

      return await withDBConnection(async (db) => {
        const last_modified = new Date().toISOString() as unknown as Date // we need a string to preserve the timezone

        const av_needs = typeof event.av_needs === 'string' && event.av_needs.trim() !== ''
          ? event.av_needs
          : null

        if (event_id) {
          // check that this account owns this event
          const existingEvent = (await db.queryTable('event', {
            where: ['event_id', '=', event_id],
          }))[0]
          if (existingEvent?.created_by_account_id !== account_id) {
            return [null, Status.Unauthorized]
          }

          await db.updateTable('event',
            {
              ...event,
              plaintext_location: event.event_site_location ? null : event.plaintext_location,
              av_needs,
              last_modified
            },
            [['event_id', '=', event_id]]
          )

          if (existingEvent.av_needs == null && av_needs != null) {
            await notifyAvNeeds(db, { ...event, av_needs }, account_id)
          }

          return [null, Status.OK]
        } else {
          // only ticketholders can create events
          // TODO: only allow on-site event creation for users with a ticket to
          // that specific festival, as opposed to just any festival
          const accountPurchases = await db.queryTable('purchase', {
            where: ['owned_by_account_id', '=', account_id],
          })
          const purchaseTypes = await db.queryTable('purchase_type')
          if (
            !accountPurchases.some((p) =>
              purchaseTypes.find((t) =>
                t.purchase_type_id === p.purchase_type_id
              )?.is_attendance_ticket
            )
          ) {
            return [null, Status.Unauthorized]
          }

          // only team members can create official events
          if (event.event_type != null && event.event_type !== 'UNOFFICIAL') {
            const account = await db.queryTable('account', {
              where: ['account_id', '=', account_id],
            })

            if (!account[0]?.is_team_member) {
              return [null, Status.Unauthorized]
            }
          }

          await db.insertTable('event', {
            ...event,
            created_by_account_id: account_id,
            plaintext_location: event.event_site_location ? null : event.plaintext_location,
            av_needs,
            last_modified
          })

          if (av_needs != null) {
            await notifyAvNeeds(db, { ...event, av_needs }, account_id)
          }

          return [null, Status.OK]
        }
      })
    },
  })

  defineRoute(router, {
    endpoint: '/event/delete',
    method: 'post',
    requireAuth: true,
    handler: async ({ jwt: { account_id }, body: { event_id } }) => {
      await withDBConnection(async (db) => {
        // check that this account owns this event
        const existingEvent = (await db.queryTable('event', {
          where: ['event_id', '=', event_id],
        }))[0]
        if (
          existingEvent == null ||
          existingEvent.created_by_account_id !== account_id
        ) {
          return [null, Status.Unauthorized]
        }

        await db.deleteTable('event_bookmark', [['event_id', '=', event_id]])
        await db.deleteTable('event', [['event_id', '=', event_id]])
      })

      return [null, Status.OK]
    },
  })

  defineRoute(router, {
    endpoint: '/event/bookmarks',
    method: 'get',
    requireAuth: true,
    handler: async ({ jwt: { account_id } }) => {
      const bookmarks = await withDBConnection((db) =>
        db.queryTable('event_bookmark', {
          where: ['account_id', '=', account_id],
        })
      )

      return [{ event_ids: bookmarks.map((b) => b.event_id) }, Status.OK]
    },
  })

  defineRoute(router, {
    endpoint: '/event/bookmark',
    method: 'post',
    requireAuth: true,
    handler: async ({ jwt: { account_id }, body: { event_id } }) => {
      await withDBConnection((db) =>
        db.insertTable('event_bookmark', {
          account_id,
          event_id,
        })
      )

      return [null, Status.OK]
    },
  })

  defineRoute(router, {
    endpoint: '/event/unbookmark',
    method: 'post',
    requireAuth: true,
    handler: async ({ jwt: { account_id }, body: { event_id } }) => {
      await withDBConnection((db) =>
        db.deleteTable('event_bookmark', [
          ['account_id', '=', account_id],
          ['event_id', '=', event_id],
        ])
      )

      return [null, Status.OK]
    },
  })

  // Share-preview redirect. Bots scraping Open Graph tags read this directly;
  // humans get an instant client-side redirect into the SPA.
  router.get('/event/:event_id', async (ctx) => {
    const eventId = ctx.params.event_id as Tables['event']['event_id']

    const event = await withDBConnection(async (db) => {
      const rows = await db.queryObject<
        & Pick<Tables['event'], 'event_id' | 'name' | 'description' | 'event_type'>
        & { creator_name: Tables['attendee']['name'] | null }
      >`
        SELECT
          event.event_id,
          event.name,
          event.description,
          event.event_type,
          attendee.name as creator_name
        FROM event
        LEFT JOIN account ON event.created_by_account_id = account.account_id
        LEFT JOIN attendee ON
          account.account_id = attendee.associated_account_id
          AND attendee.is_primary_for_account = true
        WHERE event.event_id = ${eventId}
        LIMIT 1
      `
      return rows.rows[0]
    })

    ctx.response.type = 'text/html; charset=utf-8'

    const spaUrl = `${env.FRONT_END_BASE_URL}#${encodeURIComponent(JSON.stringify({ currentView: 'Events', viewingEventDetails: eventId }))
      }`

    if (event == null) {
      ctx.response.status = Status.NotFound
      ctx.response.body = renderSharePage({
        title: 'Vibecamp event',
        description: 'This event could not be found. It may have been deleted.',
        redirectUrl: `${env.FRONT_END_BASE_URL}#${encodeURIComponent(JSON.stringify({ currentView: 'Events' }))}`,
      })
      return
    }

    const showHostByline = event.event_type === 'UNOFFICIAL' && event.creator_name
    const title = showHostByline
      ? `${event.name} hosted by ${event.creator_name}`
      : event.name

    ctx.response.status = Status.OK
    ctx.response.body = renderSharePage({
      title,
      description: event.description,
      redirectUrl: spaUrl,
    })
  })
}

function renderSharePage({ title, description, redirectUrl }: {
  title: string
  description: string
  redirectUrl: string
}) {
  const safeTitle = escapeHtml(title)
  const safeDescription = escapeHtml(truncate(description, 300))
  const safeRedirect = escapeHtml(redirectUrl)
  const safeImage = escapeHtml(env.FRONT_END_BASE_URL.replace(/\/$/, '') + '/og-share.png')

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>${safeTitle}</title>
<meta name="description" content="${safeDescription}">
<meta property="og:site_name" content="Vibecamp">
<meta property="og:title" content="${safeTitle}">
<meta property="og:description" content="${safeDescription}">
<meta property="og:image" content="${safeImage}">
<meta property="og:image:secure_url" content="${safeImage}">
<meta property="og:image:type" content="image/png">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:image:alt" content="Vibecamp">
<meta property="og:type" content="website">
<meta property="og:url" content="${safeRedirect}">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${safeTitle}">
<meta name="twitter:description" content="${safeDescription}">
<meta name="twitter:image" content="${safeImage}">
<meta name="twitter:image:alt" content="Vibecamp">
<script>window.location.replace(${JSON.stringify(redirectUrl)})</script>
</head>
<body>
<p>Redirecting to <a href="${safeRedirect}">${safeTitle}</a>&hellip;</p>
</body>
</html>`
}

function truncate(s: string, max: number) {
  if (s.length <= max) return s
  return s.slice(0, max - 1).trimEnd() + '…'
}

export async function getAllEvents() {
  return await withDBConnection(async (db) => {
    // only referred accounts can view events schedule
    // const { allowedToPurchase } = await accountReferralStatus(db, account_id)
    // if (!allowedToPurchase) {
    //   return [null, Status.Unauthorized]
    // }

    const events = await db.queryObject<
      & Tables['event']
      & {
        creator_name: Tables['attendee']['name'] | null
        bookmarks: bigint
        event_site_location_name: Tables['event_site']['name'] | null
      }
    >`
      SELECT * FROM 
      (
        SELECT DISTINCT ON (event.event_id)
          event.name,
          event.description,
          event.start_datetime,
          event.end_datetime,
          event.plaintext_location,
          event.event_site_location,
          event_site.name as event_site_location_name,
          event.event_id,
          event.created_by_account_id,
          event.event_type,
          event.will_be_filmed,
          event.av_needs,
          attendee.name as creator_name,
          COUNT(event_bookmark.account_id) as bookmarks
        FROM event
        LEFT JOIN account ON event.created_by_account_id = account.account_id
        LEFT JOIN attendee ON account.account_id = attendee.associated_account_id
        LEFT JOIN event_bookmark ON event_bookmark.event_id = event.event_id
        LEFT JOIN event_site ON event_site.event_site_id = event.event_site_location
        WHERE
          attendee.is_primary_for_account is null OR
          attendee.is_primary_for_account = true
        GROUP BY
          event.name,
          event.description,
          event.start_datetime,
          event.end_datetime,
          event.plaintext_location,
          event_site.name,
          event.event_site_location,
          event.event_id,
          event.created_by_account_id,
          event.event_type,
          event.will_be_filmed,
          event.av_needs,
          account.email_address,
          attendee.name
        ORDER BY
          event.event_id
      ) events
      ORDER BY start_datetime
    `

    return events.rows.map(({ bookmarks, ...e }) => ({
      ...stringifyStartAndEndDates(e),
      bookmarks: Number(bookmarks),
    }))
  })
}

export type EventInfo = Awaited<ReturnType<typeof getAllEvents>>[number]

async function notifyAvNeeds(
  db: VibecampDBClient,
  event: {
    name: string
    description: string
    start_datetime: string | Date
    end_datetime: string | Date | null
    event_site_location: Tables['event']['event_site_location']
    av_needs: string
  },
  account_id: Tables['account']['account_id'],
) {
  try {
    const account = (await db.queryTable('account', {
      where: ['account_id', '=', account_id],
    }))[0]
    const attendees = await db.queryTable('attendee', {
      where: ['associated_account_id', '=', account_id],
    })
    const primaryAttendee = attendees.find(a => a.is_primary_for_account) ?? attendees[0]

    const eventSite = event.event_site_location
      ? (await db.queryTable('event_site', {
        where: ['event_site_id', '=', event.event_site_location],
      }))[0]
      : undefined

    if (account == null) return

    await sendMail(avNeedsEmail(
      {
        name: event.name,
        description: event.description,
        start_datetime: new Date(event.start_datetime as string),
        end_datetime: event.end_datetime ? new Date(event.end_datetime as string) : null,
        av_needs: event.av_needs,
      },
      { name: primaryAttendee?.name ?? null, email_address: account.email_address },
      eventSite?.name ?? null,
    ))
  } catch (err) {
    console.error('Failed to send A/V needs email:', err)
  }
}