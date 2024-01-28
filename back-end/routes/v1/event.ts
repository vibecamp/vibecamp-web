import { Router, Status } from 'oak'
import { defineRoute } from './_common.ts'
import { accountReferralStatus, withDBConnection } from '../../utils/db.ts'
import { TABLE_ROWS, Tables } from '../../types/db-types.ts'
import { EventJson } from '../../types/route-types.ts'

const eventToJson = (event: Tables['event']): EventJson => ({
  ...event,
  start_datetime: event.start_datetime?.toISOString(),
  end_datetime: event.end_datetime?.toISOString() ?? null
})

export default function register(router: Router) {

  defineRoute(router, {
    endpoint: '/events',
    method: 'get',
    requireAuth: true,
    handler: async ({ jwt: { account_id } }) => {
      return await withDBConnection(async db => {

        // only referred accounts can view events schedule
        const { allowedToPurchase } = await accountReferralStatus(db, account_id, TABLE_ROWS.next_festival[0].festival_id)
        if (!allowedToPurchase) {
          return [null, Status.Unauthorized]
        }

        const events = await db.queryObject<Tables['event'] & { creator_email_address: Tables['account']['email_address'], creator_name: Tables['attendee']['name'], bookmarks: bigint }>`
          SELECT
            event.name,
            event.description,
            event.start_datetime,
            event.end_datetime,
            event.plaintext_location,
            event.event_site_location,
            event.event_id,
            event.created_by_account_id,
            event.event_type,
            account.email_address as creator_email_address,
            attendee.name as creator_name,
            COUNT(event_bookmark.account_id) as bookmarks
          FROM event
          LEFT JOIN account ON event.created_by_account_id = account.account_id
          LEFT JOIN attendee ON account.account_id = attendee.associated_account_id
          LEFT JOIN event_bookmark ON event_bookmark.event_id = event.event_id
          WHERE attendee.is_primary_for_account = true
          GROUP BY
            event.name,
            event.description,
            event.start_datetime,
            event.end_datetime,
            event.plaintext_location,
            event.event_site_location,
            event.event_id,
            event.created_by_account_id,
            account.email_address,
            attendee.name
          ORDER BY
            event.start_datetime
        `

        return [
          {
            events: events.rows.map(e => ({
              ...eventToJson(e),
              created_by: e.creator_name || e.creator_email_address,
              bookmarks: Number(e.bookmarks)
            }))
          },
          Status.OK
        ]
      })
    },
  })

  defineRoute(router, {
    endpoint: '/event-sites',
    method: 'post',
    requireAuth: true,
    handler: async ({ jwt: { account_id }, body: { festival_id } }) => {
      return await withDBConnection(async db => {

        // only referred accounts can view events schedule
        const { allowedToPurchase } = await accountReferralStatus(db, account_id, TABLE_ROWS.next_festival[0].festival_id)
        if (!allowedToPurchase) {
          return [null, Status.Unauthorized]
        }

        const festival = TABLE_ROWS.festival.find(f => f.festival_id === festival_id)
        return [{ eventSites: TABLE_ROWS.event_site.filter(s => s.festival_site_id === festival?.festival_site_id).toSorted((a, b) => a.name.localeCompare(b.name)) }, Status.OK]
      })
    }
  })


  defineRoute(router, {
    endpoint: '/event/save',
    method: 'post',
    requireAuth: true,
    handler: async ({ jwt: { account_id }, body: { event } }) => {
      const { event_id } = event

      return await withDBConnection(async db => {
        if (event_id) {

          // check that this account owns this event
          const existingEvent = (await db.queryTable('event', { where: ['event_id', '=', event_id] }))[0]
          if (existingEvent?.created_by_account_id !== account_id) {
            return [null, Status.Unauthorized]
          }

          const updatedEvent = (await db.updateTable('event', event, [['event_id', '=', event_id]]))[0]

          return [{ event: eventToJson(updatedEvent!) }, Status.OK]
        } else {

          // only ticketholders can create events
          const accountPurchases = await db.queryTable('purchase', { where: ['owned_by_account_id', '=', account_id] })
          if (!accountPurchases.some(p => p.purchase_type_id.startsWith('ATTENDANCE_'))) {
            return [null, Status.Unauthorized]
          }

          // only team members can create official events
          if (event.event_type != null && event.event_type !== 'UNOFFICIAL') {
            const account = await db.queryTable('account', { where: ['account_id', '=', account_id] })

            if (!account[0]?.is_team_member) {
              return [null, Status.Unauthorized]
            }
          }

          const createdEvent = await db.insertTable('event', {
            ...event,
            created_by_account_id: account_id
          })

          return [{ event: eventToJson(createdEvent!) }, Status.OK]
        }
      })
    },
  })

  defineRoute(router, {
    endpoint: '/event/delete',
    method: 'post',
    requireAuth: true,
    handler: async ({ jwt: { account_id }, body: { event_id } }) => {
      await withDBConnection(async db => {

        // check that this account owns this event
        const existingEvent = (await db.queryTable('event', { where: ['event_id', '=', event_id] }))[0]
        if (existingEvent == null || existingEvent.created_by_account_id !== account_id) {
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
      const bookmarks = await withDBConnection(db => db.queryTable('event_bookmark', {
        where: ['account_id', '=', account_id]
      }))

      return [{ event_ids: bookmarks.map(b => b.event_id) }, Status.OK]
    },
  })

  defineRoute(router, {
    endpoint: '/event/bookmark',
    method: 'post',
    requireAuth: true,
    handler: async ({ jwt: { account_id }, body: { event_id } }) => {
      await withDBConnection(db => db.insertTable('event_bookmark', {
        account_id,
        event_id
      }))

      return [null, Status.OK]
    },
  })

  defineRoute(router, {
    endpoint: '/event/unbookmark',
    method: 'post',
    requireAuth: true,
    handler: async ({ jwt: { account_id }, body: { event_id } }) => {
      await withDBConnection(db => db.deleteTable('event_bookmark', [
        ['account_id', '=', account_id],
        ['event_id', '=', event_id],
      ]))

      return [null, Status.OK]
    },
  })


}
