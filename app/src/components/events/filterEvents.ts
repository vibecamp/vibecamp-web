import type { DayjsEvent } from '@/hooks/useStore'
import type { Dayjs } from '@/lib/dayjs'
import type { EventsFilter } from '@/lib/hash-redirect'

type FilterableEvent = Pick<
    DayjsEvent,
    | 'event_id'
    | 'name'
    | 'description'
    | 'creator_name'
    | 'plaintext_location'
    | 'event_site_location_name'
    | 'created_by_account_id'
    | 'start_datetime'
>

type FilterContext = {
    filter: EventsFilter
    searchString: string
    bookmarkedEventIds: readonly string[] | undefined
    accountId: string | undefined
    now: Dayjs
}

const includes = (haystack: string | null | undefined, needle: string) =>
    haystack?.toLocaleLowerCase().includes(needle) ?? false

export function matchesSearch(event: FilterableEvent, searchString: string): boolean {
    const needle = searchString.toLocaleLowerCase()
    return (
        includes(event.name, needle) ||
        includes(event.creator_name, needle) ||
        includes(event.description, needle) ||
        includes(event.plaintext_location, needle) ||
        includes(event.event_site_location_name, needle)
    )
}

export function filterEvents<E extends FilterableEvent>(
    events: readonly E[],
    { filter, searchString, bookmarkedEventIds, accountId, now }: FilterContext,
): E[] {
    const searched = events.filter((e) => matchesSearch(e, searchString))
    const cutoff = now.subtract(1, 'day')

    switch (filter) {
        case 'All':
            return searched.filter((e) => e.start_datetime.isAfter(cutoff))
        case 'Bookmarks':
            return searched.filter(
                (e) =>
                    e.start_datetime.isAfter(cutoff) &&
                    (bookmarkedEventIds?.includes(e.event_id) ?? false),
            )
        case 'Mine':
            return searched.filter((e) => e.created_by_account_id === accountId).reverse()
        case 'Past':
            return searched.filter((e) => e.start_datetime.isBefore(cutoff)).reverse()
    }
}
