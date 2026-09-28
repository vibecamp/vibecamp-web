import type { Tables } from '@/db/types'
import type { Badge, Cart, Catalog, Quote } from '@/lib/cart'
import type { OrderStatus } from '@/server/purchase'
import type { AttendeeInfo, FullAccountInfo } from './misc'

export type Routes = {
    '/account': {
        method: 'get'
        body: undefined
        response: FullAccountInfo
    }
    '/account/update-email': {
        method: 'put'
        body: Pick<Tables['account'], 'email_address'>
        response: null
    }
    '/account/update-password': {
        method: 'put'
        body: {
            password: string
        }
        response: null
    }
    '/account/send-password-reset-email': {
        method: 'post'
        body: {
            email_address: string
        }
        response: null
    }
    '/account/reset-password': {
        method: 'put'
        body: {
            password: string
            secret: string
        }
        response: {
            jwt: string | null
        }
    }
    '/login': {
        method: 'post'
        body: {
            email_address: Tables['account']['email_address']
            password: string
        }
        response: {
            jwt: string | null
        }
    }
    '/signup': {
        method: 'post'
        body: {
            email_address: Tables['account']['email_address']
            password: string
        }
        response: {
            jwt: string | null
        }
    }
    '/events': {
        method: 'get'
        body: undefined
        response: {
            events: (EventJson & {
                creator_name: string | null
                bookmarks: number
                event_site_location_name: Tables['event_site']['name'] | null
            })[]
        }
    }
    '/event/save': {
        method: 'post'
        body: {
            event: Omit<
                EventJson,
                | 'created_by_account_id'
                | 'event_id'
                | 'event_type'
                | 'will_be_filmed'
                | 'last_modified'
            > & {
                event_id: Tables['event']['event_id'] | undefined
            }
        }
        response: null
    }
    '/event/delete': {
        method: 'post'
        body: {
            event_id: Tables['event']['event_id']
        }
        response: null
    }
    '/event/bookmarks': {
        method: 'get'
        body: undefined
        response: {
            event_ids: Tables['event_bookmark']['event_id'][]
        }
    }
    '/event/bookmark': {
        method: 'post'
        body: {
            event_id: Tables['event']['event_id']
        }
        response: null
    }
    '/event/unbookmark': {
        method: 'post'
        body: {
            event_id: Tables['event']['event_id']
        }
        response: null
    }
    '/purchase/catalog': { method: 'get'; body: undefined; response: Catalog }
    '/purchase/quote': { method: 'post'; body: Cart; response: Quote }
    '/purchase/checkout-session': {
        method: 'post'
        body: { cart: Cart; quote_hash: string; request_id: string; accepted_terms: true }
        response: { order_id: string; url: string }
    }
    '/purchase/checkout-session/status': {
        method: 'post'
        body: { order_id: string; cancel?: true }
        response: OrderStatus
    }
    '/ticket/badge': { method: 'put'; body: { ticket_id: string; badge: Badge }; response: null }
    '/account/profile': { method: 'put'; body: AttendeeInfo; response: null }
    '/reference': {
        method: 'get'
        body: undefined
        response: {
            festivals: Tables['festival'][]
            event_sites: Tables['event_site'][]
            age_ranges: Tables['age_range'][]
        }
    }
}

export type EventJson = Omit<Tables['event'], 'start_datetime' | 'end_datetime'> & {
    start_datetime: string
    end_datetime: string | null
}

export type Purchases = Partial<Record<Tables['purchase_type']['purchase_type_id'], number>>
