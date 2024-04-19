import { Router, Status } from 'oak'
import { defineRoute } from './_common.ts'
import { withDBConnection } from '../../utils/db.ts'
import { Tables } from '../../types/db-types.ts'
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
        // const { allowedToPurchase } = await accountReferralStatus(db, account_id)
        // if (!allowedToPurchase) {
        //   return [null, Status.Unauthorized]
        // }

        const events = await db.queryObject<
          Tables['event'] &
          {
            creator_name: Tables['attendee']['name'] | null,
            bookmarks: bigint
          }
        >`
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
            attendee.name as creator_name,
            COUNT(event_bookmark.account_id) as bookmarks
          FROM event
          LEFT JOIN account ON event.created_by_account_id = account.account_id
          LEFT JOIN attendee ON account.account_id = attendee.associated_account_id
          LEFT JOIN event_bookmark ON event_bookmark.event_id = event.event_id
          WHERE
            attendee.is_primary_for_account is null OR
            attendee.is_primary_for_account = true
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
            events: events.rows.map(({ bookmarks, creator_name, ...e }) => ({
              ...eventToJson(e),
              creator_name,
              bookmarks: Number(bookmarks)
            }))
          },
          Status.OK
        ]
      })
    },
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
          // TODO: only allow on-site event creation for users with a ticket to
          // that specific festival, as opposed to just any festival
          const accountPurchases = await db.queryTable('purchase', { where: ['owned_by_account_id', '=', account_id] })
          const purchaseTypes = await db.queryTable('purchase_type')
          if (!accountPurchases.some(p => purchaseTypes.find(t => t.purchase_type_id === p.purchase_type_id)?.is_attendance_ticket)) {
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
