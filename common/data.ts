
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
    allowed_to_purchase_tickets: boolean,
    attendees: Array<{
        attendee_id: number;
        name: string;
        is_child: boolean;
        dietary_restrictions: string;
        has_purchased_bedding: boolean;
        has_purchased_bus_ticket: string;
        attendee_notes: string;
        associated_account_id: number;
        is_default_for_account: boolean;
    }>,
    tickets: Array<{
        ticket_id: number;
        event_id: number;
        owned_by_account_id: number;
        assigned_to_attendee_id: number;
    }>
}

export type Maybe<T> = T | null | undefined