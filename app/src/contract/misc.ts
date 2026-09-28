import type { Tables } from '@/db/types'

export type VibeJWTPayload = {
    iss?: string
    sub?: string
    aud?: string[] | string
    exp?: number
    nbf?: number
    iat?: number
    jti?: string
    [key: string]: unknown
    account_id: Tables['account']['account_id']
}

export type AttendeeInfo = Pick<
    Tables['attendee'],
    'name' | 'phone_number' | 'twitter_handle' | 'discord_handle' | 'age_range'
>

export type FullAccountInfo = Pick<Tables['account'], 'account_id' | 'email_address'> & {
    owned_tickets: import('@/server/tickets').OwnedTicket[]
    primary_attendee: AttendeeInfo | null
}

export type Maybe<T> = T | null | undefined
