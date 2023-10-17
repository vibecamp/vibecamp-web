import { FullAccountInfo } from "./data.ts"

export type Routes = {
    '/account': {
        method: 'get',
        body: undefined,
        response: FullAccountInfo | null
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
    '/ticket/create-purchase-intent': {
        method: 'post',
        body: {
            adult_tickets: number,
            child_tickets: number,
            bus_tickets: number,
            bedding_tickets: number
        },
        response: { stripe_client_secret: string } | null
    }
}