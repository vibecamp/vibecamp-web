import { describe, expect, it } from 'vitest'
import { filterEvents, matchesSearch } from '@/components/events/filterEvents'
import dayjs from '@/lib/dayjs'

const now = dayjs.utc('2026-06-10T12:00:00')

const event = (
    id: string,
    start: string,
    extra: Partial<Parameters<typeof matchesSearch>[0]> = {},
): Parameters<typeof matchesSearch>[0] => ({
    event_id: id,
    name: `Event ${id}`,
    description: '',
    creator_name: null,
    plaintext_location: null,
    event_site_location_name: null,
    created_by_account_id: 'someone-else',
    start_datetime: dayjs.utc(start),
    ...extra,
})

const events = [
    event('old', '2026-06-01T10:00:00', { created_by_account_id: 'me' }),
    event('yesterday', '2026-06-09T13:00:00'),
    event('today', '2026-06-10T18:00:00', { creator_name: 'Ada' }),
    event('later', '2026-06-20T18:00:00', {
        created_by_account_id: 'me',
        plaintext_location: 'The lake',
    }),
]

const context = {
    filter: 'All' as const,
    searchString: '',
    bookmarkedEventIds: ['later'],
    accountId: 'me',
    now,
}

const ids = (list: ReturnType<typeof filterEvents<(typeof events)[number]>>) =>
    list.map((e) => e.event_id)

describe('filterEvents', () => {
    it('"All" hides events that started more than a day ago', () => {
        expect(ids(filterEvents(events, context))).toEqual(['yesterday', 'today', 'later'])
    })

    it('"Bookmarks" keeps only bookmarked upcoming events', () => {
        expect(ids(filterEvents(events, { ...context, filter: 'Bookmarks' }))).toEqual(['later'])
        expect(
            ids(
                filterEvents(events, {
                    ...context,
                    filter: 'Bookmarks',
                    bookmarkedEventIds: undefined,
                }),
            ),
        ).toEqual([])
    })

    it('"Mine" lists my events regardless of date, newest first', () => {
        expect(ids(filterEvents(events, { ...context, filter: 'Mine' }))).toEqual(['later', 'old'])
        expect(
            ids(filterEvents(events, { ...context, filter: 'Mine', accountId: undefined })),
        ).toEqual([])
    })

    it('"Past" lists old events newest first', () => {
        expect(ids(filterEvents(events, { ...context, filter: 'Past' }))).toEqual(['old'])
    })

    it('searches name, host, description and both kinds of location, case-insensitively', () => {
        expect(ids(filterEvents(events, { ...context, searchString: 'ada' }))).toEqual(['today'])
        expect(ids(filterEvents(events, { ...context, searchString: 'LAKE' }))).toEqual(['later'])
        expect(
            matchesSearch(
                event('x', '2026-06-10T00:00:00', { description: 'Bring snacks' }),
                'snack',
            ),
        ).toBe(true)
        expect(
            matchesSearch(
                event('x', '2026-06-10T00:00:00', { event_site_location_name: 'Amphitheater' }),
                'amph',
            ),
        ).toBe(true)
        expect(matchesSearch(event('x', '2026-06-10T00:00:00'), 'nothing')).toBe(false)
    })
})
