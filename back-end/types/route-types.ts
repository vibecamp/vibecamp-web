import { Tables } from "./db-types.ts"
import { AttendeeInfo, FullAccountInfo } from "./misc.ts"

export type Routes = {
    '/account': {
        method: 'get',
        body: undefined,
        response: FullAccountInfo
    },
    '/account/update-email': {
        method: 'put',
        body: Pick<Tables['account'], 'email_address'>,
        response: null
    },
    '/account/update-password': {
        method: 'put',
        body: {
            password: string
        },
        response: null
    },
    '/account/send-password-reset-email': {
        method: 'post',
        body: {
            email_address: string
        },
        response: null
    },
    '/account/reset-password': {
        method: 'put',
        body: {
            password: string,
            secret: string
        },
        response: {
            jwt: string | null
        }
    },
    '/account/update-attendee': {
        method: 'put',
        body: Pick<Tables['attendee'], 'attendee_id'> & Partial<Omit<Tables['attendee'], 'associated_account_id' | 'notes'>>,
        response: Tables['attendee']
    },
    '/account/submit-invite-code': {
        method: 'post',
        body: {
            invite_code: Tables['invite_code']['code']
        },
        response: null
    },
    '/account/submit-application': {
        method: 'post',
        body: NewApplication,
        response: null
    },
    '/login': {
        method: 'post',
        body: {
            email_address: Tables['account']['email_address'],
            password: string
        },
        response: {
            jwt: string | null
        }
    },
    '/signup': {
        method: 'post',
        body: {
            email_address: Tables['account']['email_address'],
            password: string
        },
        response: {
            jwt: string | null
        }
    },
    '/events': {
        method: 'get',
        body: undefined,
        response: {
            events: (EventJson & {
                creator_name: string | null,
                bookmarks: number,
                event_site_location_name: Tables['event_site']['name'] | null
            })[]
        }
    },
    '/event/save': {
        method: 'post',
        body: {
            event: Omit<EventJson, 'created_by_account_id' | 'event_id' | 'event_type'> & { event_id: Tables['event']['event_id'] | undefined, event_type: Tables['event']['event_type'] | undefined }
        },
        response: { event: EventJson }
    },
    '/event/delete': {
        method: 'post',
        body: {
            event_id: Tables['event']['event_id']
        },
        response: null
    },
    '/event/bookmarks': {
        method: 'get',
        body: undefined,
        response: {
            event_ids: Tables['event_bookmark']['event_id'][]
        }
    },
    '/event/bookmark': {
        method: 'post',
        body: {
            event_id: Tables['event']['event_id']
        },
        response: null
    },
    '/event/unbookmark': {
        method: 'post',
        body: {
            event_id: Tables['event']['event_id']
        },
        response: null
    },
    '/purchase/create-intent': {
        method: 'post',
        body: {
            purchases: Purchases,
            discount_codes: readonly string[],
            attendees: AttendeeInfo[],
        },
        response: { stripe_client_secret: string }
    }
} & PublicTablesRoutes

export type NewApplication = Omit<Tables['application'], 'application_id' | 'submitted_on' | 'is_accepted'>

export type EventJson = Omit<Tables['event'], 'start_datetime' | 'end_datetime'> & {
    start_datetime: string,
    end_datetime: string | null
}

export type Purchases = Partial<Record<Tables['purchase_type']['purchase_type_id'], number>>

/**
 * The **entire contents** of these tables will be **public** to all users.
 * Don't include any that contain user-specific info!
 */
export const PUBLIC_TABLES = [
    'purchase_type',
    'discount',
    'festival',
    'festival_site',
    'event_site'
] as const satisfies Readonly<Array<keyof Tables>>

type PublicTables = typeof PUBLIC_TABLES

type PublicTablesRoutes = {
    [Table in PublicTables[number]as `/tables/${Table}`]: {
        method: 'get',
        body: undefined,
        response: Tables[Table][]
    }
}