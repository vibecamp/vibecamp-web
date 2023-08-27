
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
        name: string | null,
        is_child: boolean | null,
        dietary_restrictions: string | null,
        has_purchased_bedding: boolean | null,
        has_purchased_bus_ticket: string | null,
        is_default_for_account: boolean | null,
        ticket: {
            ticket_id: number | null,
            event_id: number | null,
        }
    }>
}