import { Attendee, InviteCode, Ticket } from "../db-types.ts"

export type VibeJWTPayload = {
    iss?: string,
    sub?: string,
    aud?: string[] | string,
    exp?: number,
    nbf?: number,
    iat?: number,
    jti?: string,
    [key: string]: unknown,
    account_id: number
}

export type FullAccountInfo = {
    account_id: number,
    email_address: string,
    allowed_to_purchase_tickets: number,
    attendees: Array<Attendee>,
    tickets: Array<Ticket>,
    inviteCodes: Array<InviteCode & {
        used_by: string | null
    }>
}

export type Maybe<T> = T | null | undefined