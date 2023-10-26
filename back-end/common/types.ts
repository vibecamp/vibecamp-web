import { TABLE_ROWS, Tables } from "../db-types.ts"
import { objectFromEntries } from './utils.ts'

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
    allowed_to_purchase: boolean,
    attendees: Array<Tables['attendee']>,
    purchases: Array<Tables['purchase']>,
    inviteCodes: Array<Tables['invite_code'] & {
        used_by: string | null
    }>
}

export type AttendeeInfo = Omit<Tables['attendee'], 'attendee_id' | 'notes' | 'associated_account_id' | 'age_group'> & {
    age_group: Tables['attendee']['age_group'] | null
}

export type UnknownObject = Record<string | number | symbol, unknown>

export type Maybe<T> = T | null | undefined

export const PURCHASE_TYPES_BY_TYPE = objectFromEntries(
    TABLE_ROWS.purchase_type.map(r => [r.purchase_type_id, r])
)

export type PurchaseType = keyof typeof PURCHASE_TYPES_BY_TYPE