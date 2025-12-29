import { Router, Status } from 'oak'
import { defineRoute } from './_common.ts'
import { withDBConnection } from '../../utils/db.ts'
import { Tables } from '../../types/db-types.ts'
import dayjs from '../../utils/dayjs.ts'
import { given } from '../../utils/misc.ts'
import { icsCalendar } from '../../utils/ics.ts'

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
    requireAuth: true,
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
        if (event_id) {
          // check that this account owns this event
          const existingEvent = (await db.queryTable('event', {
            where: ['event_id', '=', event_id],
          }))[0]
          if (existingEvent?.created_by_account_id !== account_id) {
            return [null, Status.Unauthorized]
          }

          const updatedEvent = (await db.updateTable('event', event, [[
            'event_id',
            '=',
            event_id,
          ]]))[0]

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

          const createdEvent = await db.insertTable('event', {
            ...event,
            created_by_account_id: account_id,
          })

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