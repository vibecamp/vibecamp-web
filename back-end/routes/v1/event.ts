import { Router, Status } from 'oak'
import { defineRoute } from './_common.ts'
import { withDBConnection } from '../../utils/db.ts'
import { Tables } from '../../types/db-types.ts'
import { EventJson } from '../../types/route-types.ts'

const eventToJson = (event: Tables['event']): EventJson => ({
  ...event,
  start_datetime: event.start_datetime.toISOString(),
  end_datetime: event.end_datetime?.toISOString() ?? null
})

export default function register(router: Router) {

  defineRoute(router, {
    endpoint: '/events',
    method: 'get',
    requireAuth: true,
    handler: async () => {
      const events = await withDBConnection(db => db.queryTable('event'))
      return [{ events: events.map(eventToJson) }, Status.OK]
    },
  })

  defineRoute(router, {
    endpoint: '/event/save',
    method: 'post',
    requireAuth: true,
    handler: async ({ jwt: { account_id }, body: { event } }) => {
      const { event_id } = event

      if (event_id) {
        return await withDBConnection(async db => {
          const existingEvent = (await db.queryTable('event', { where: ['event_id', '=', event_id] }))[0]

          if (existingEvent?.created_by !== account_id) {
            return [null, Status.Unauthorized]
          }

          const updatedEvent = (await db.updateTable('event', event, [['event_id', '=', event_id]]))[0]

          return [{ event: eventToJson(updatedEvent!) }, Status.OK]
        })
      } else {
        const createdEvent = await withDBConnection(db => db.insertTable('event', {
          ...event,
          created_by: account_id
        }))

        return [{ event: eventToJson(createdEvent!) }, Status.OK]
      }
    },
  })

  // defineRoute(router, {
  //   endpoint: '/event/delete',
  //   method: 'post',
  //   requireAuth: true,
  //   handler: async ({ ctx, jwt }) => {
  //     // extract event ID from request
  //     const { event_id } = await ctx.request.body({ type: 'json' }).value as {
  //       event_id?: number
  //     }

  //     // TODO: check that jwt user owns this event

  //     // TODO: delete the event from the DB

  //     return [{}, Status.OK]
  //   },
  // })

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
