import { jsonParse, PASSWORD_RESET_SECRET_KEY } from '@/lib/misc'
import {
    ACCOUNT_PATH,
    buyTicketsPath,
    DEFAULT_PATH,
    EVENTS_PATH,
    eventPath,
    RESET_PASSWORD_PATH,
    TICKETS_PATH,
} from '@/lib/routes'

const VIEW_PATHS: Readonly<Record<string, string>> = {
    Tickets: TICKETS_PATH,
    Events: EVENTS_PATH,
    Account: ACCOUNT_PATH,
}

export const EVENTS_FILTERS = ['All', 'Bookmarks', 'Mine', 'Past'] as const
export type EventsFilter = (typeof EVENTS_FILTERS)[number]

const isEventsFilter = (value: string): value is EventsFilter =>
    (EVENTS_FILTERS as readonly string[]).includes(value)

function isOldDeepLink(hash: string): boolean {
    return hash.startsWith('#{') || hash.slice(0, 4).toUpperCase() === '#%7B'
}

function parseOldHash(hash: string): Record<string, unknown> | null {
    if (!isOldDeepLink(hash)) {
        return null
    }
    let decoded: string
    try {
        decoded = decodeURIComponent(hash.slice(1))
    } catch {
        return null
    }
    const parsed = jsonParse(decoded)
    return typeof parsed === 'object' && parsed !== null && !Array.isArray(parsed)
        ? (parsed as Record<string, unknown>)
        : null
}

export function hashToPath(hash: string): string | null {
    const state = parseOldHash(hash)
    if (state == null) {
        return null
    }
    const str = (key: string): string | undefined => {
        const value = state[key]
        return typeof value === 'string' && value !== '' ? value : undefined
    }

    const secret = str(PASSWORD_RESET_SECRET_KEY)
    if (secret != null) {
        return `${RESET_PASSWORD_PATH}?${new URLSearchParams({ secret }).toString()}`
    }

    const eventId = str('viewingEventDetails')
    if (eventId != null) {
        return eventPath(eventId)
    }

    const purchaseState = str('ticketPurchaseModalState')
    if (purchaseState != null) {
        return purchaseState === 'payment' || purchaseState === 'gift-sent'
            ? TICKETS_PATH
            : buyTicketsPath(purchaseState)
    }

    const view = VIEW_PATHS[str('currentView') ?? ''] ?? DEFAULT_PATH
    if (view !== EVENTS_PATH) {
        return view
    }

    const params = new URLSearchParams()
    const filter = str('eventsFilter')
    if (filter != null && isEventsFilter(filter)) {
        params.set('filter', filter)
    }
    if (state.compactEventsView === true) {
        params.set('compact', '1')
    }
    const query = params.toString()
    return query === '' ? EVENTS_PATH : `${EVENTS_PATH}?${query}`
}
