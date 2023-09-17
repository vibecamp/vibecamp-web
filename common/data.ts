
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
    attendees: Array<{
        attendee_id: number,
        name: Maybe<string>,
        is_child: Maybe<boolean>,
        dietary_restrictions: Maybe<string>,
        has_purchased_bedding: Maybe<boolean>,
        has_purchased_bus_ticket: Maybe<string>,
        is_default_for_account: Maybe<boolean>,
        ticket: {
            ticket_id: Maybe<number>,
            event_id: Maybe<number>,
        }
    }>
}

export type Maybe<T> = T | null | undefined