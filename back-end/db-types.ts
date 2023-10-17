export type Tables = {
  account: {
    account_id: number
    email_address: string
    password_hash: string
    password_salt: string
    account_notes: string
    is_seed_account: boolean
    is_application_accepted: boolean
  },
  age_group: {
    age_group: string
    is_child: boolean
  },
  attendee: {
    attendee_id: number
    name: string | null
    dietary_restrictions: string
    attendee_notes: string
    associated_account_id: number
    age_group: string | null
    discord_handle: string | null
    interested_in_volunteering: boolean
    interested_in_pre_call: boolean
    planning_to_camp: boolean
  },
  event: {
    // TODO
  },
  festival: {
    festival_id: number
    festival_name: string
    festival_site_id: number
    start_date: unknown
    end_date: unknown
    available_tickets: number
  },
  festival_site: {
    festival_site_id: number
    festival_site_name: string
    location: unknown
  },
  invite_code: {
    invite_code_id: number
    code: string
    created_by_account_id: number
    used_by_account_id: number | null
    festival_id: number
  },
  ticket: {
    ticket_id: number
    owned_by_account_id: number | null
    assigned_to_attendee_id: number | null
    purchased_on: unknown
    ticket_type_id: number
  },
  ticket_type: {
    ticket_type: string
    price_in_cents: number
    festival_id: number
    ticket_type_id: number
  }
}

export type TableName = keyof Tables