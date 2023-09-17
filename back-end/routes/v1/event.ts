// import { Event } from "common/data.ts";
import { Router, Status } from "oak";
import { defineRoute } from "./_common.ts";
type Event = any

export default function register(router: Router) {
    const baseRoute: `/${string}` = '/event'

    defineRoute<{ event: Event | null }>(router, {
        endpoint: baseRoute + '/create',
        method: 'post',
        requireAuth: true,
        handler: async ({ ctx, jwt }) => {

            // extract event data from request
            const event = await ctx.request.body({ type: 'json' }).value as Omit<Event, 'event_id' | 'creator_id'>

            // TODO: create the event in the DB

            // TODO: assemble the full event, with event_id and creator_id included

            return [{ event: null }, Status.OK]
        }
    })

    defineRoute<{}>(router, {
        endpoint: baseRoute + '/edit',
        method: 'post',
        requireAuth: true,
        handler: async ({ ctx, jwt }) => {

            // extract event data from request
            const event = await ctx.request.body({ type: 'json' }).value as Event

            // TODO: check that the jwt user owns this event

            // TODO: update DB record with provided values

            return [{}, Status.OK]
        }
    })

    defineRoute<{}>(router, {
        endpoint: baseRoute + '/delete',
        method: 'post',
        requireAuth: true,
        handler: async ({ ctx, jwt }) => {

            // extract event ID from request
            const { event_id } = await ctx.request.body({ type: 'json' }).value as { event_id?: number }

            // TODO: check that jwt user owns this event

            // TODO: delete the event from the DB

            return [{}, Status.OK]
        }
    })

    defineRoute<{ events: Event[] | null }>(router, {
        endpoint: baseRoute,
        method: 'get',
        requireAuth: true,
        handler: async ({ ctx, jwt }) => {
            // const events = await getAllEvents()

            return [{ events: null }, Status.OK]
        }
    })
}

// [
//     {
//         event_id: 1,
//         name: 'Lockpicking',
//         description: 'Learn the basics of lockpicking in the roundtable room! Locks and pick sets will remain available at a table for the duration of camp. By taking this workshop you agree to teach at least one other person at vibecamp how to pick locks.',
//         start: '2023-06-15T16:00:00-04:00',
//         end: '2023-06-15T17:00:00-04:00',
//         locationName: 'Roundtable Room',
//         locationAddress: '',
//         visibility: 'public' as const,
//         visibilityWhitelist: [],
//         creator: 'Ramuel'
//     },
//     {
//         event_id: 2,
//         name: 'Speed Friending',
//         description: 'Meet lots of vibecampers in a short amount of time.',
//         start: '2023-06-15T16:00:00-04:00',
//         end: '2023-06-15T17:00:00-04:00',
//         locationName: 'Meeting Room',
//         locationAddress: '',
//         visibility: 'public' as const,
//         visibilityWhitelist: [],
//         creator: '@brundolfsmith'
//     },
//     {
//         event_id: 3,
//         name: 'Dinner',
//         description: 'To reduce long lines and congestion we have assigned all attendees to recommended mealtimes. They aren’t enforced and we understand if you want to shift a little bit for a can’t-miss event, but please try to follow the schedule when you can. Thursday night times are a little early to accommodate opening ceremonies.\nCyan: 5:00 PM\nYellow: 6:00 PM\nMagenta: 7:00 PM',
//         start: '2023-06-15T16:00:00-04:00',
//         end: '2023-06-15T20:00:00-04:00',
//         locationName: 'Dining Hall',
//         locationAddress: '',
//         visibility: 'public' as const,
//         visibilityWhitelist: [],
//         creator: 'Official'
//     },
//     {
//         event_id: 4,
//         name: 'Live Twitter Polls',
//         description: 'Live twitter polls, spicy level: high.',
//         start: '2023-06-15T17:45:00-04:00',
//         end: '2023-06-15T18:45:00-04:00',
//         locationName: 'Amphitheater',
//         locationAddress: '',
//         visibility: 'public' as const,
//         visibilityWhitelist: [],
//         creator: 'Aella & Robin Hanson'
//     }
// ]