import { TABLE_ROWS, Tables } from "./db-types.ts"
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
        body: { password: string },
        response: null
    },
    '/account/update-attendee': {
        method: 'put',
        body: Pick<Tables['attendee'], 'attendee_id'> & Partial<Omit<Tables['attendee'], 'associated_account_id' | 'notes'>>,
        response: Tables['attendee']
    },
    '/account/submit-invite-code': {
        method: 'post',
        body: {
            invite_code: string
        },
        response: null
    },
    '/login': {
        method: 'post',
        body: {
            email_address: string,
            password: string
        },
        response: {
            jwt: string | null
        }
    },
    '/signup': {
        method: 'post',
        body: {
            email_address: string,
            password: string
        },
        response: {
            jwt: string | null
        }
    },
    '/event/create': {
        method: 'post',
        body: unknown,
        response: { event: unknown }
    },
    '/event/edit': {
        method: 'post',
        body: unknown,
        response: {}
    },
    '/event/delete': {
        method: 'post',
        body: unknown,
        response: {}
    },
    '/events': {
        method: 'get',
        body: undefined,
        response: { events: null }
    },
    '/purchase/create-attendees': {
        method: 'post',
        body: AttendeeInfo[],
        response: null
    },
    '/purchase/create-intent': {
        method: 'post',
        body: Purchases,
        response: { stripe_client_secret: string }
    },
    '/festival-info': {
        method: 'get',
        body: unknown,
        response: Omit<Tables['festival'], 'start_date' | 'end_date'> & {
            start_date: string,
            end_date: string
        }
    }
}

export type Purchases = Partial<Record<(typeof TABLE_ROWS)['purchase_type'][number]['purchase_type_id'], number>>

