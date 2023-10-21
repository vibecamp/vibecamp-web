export type Tables = {
  account: {
    account_id: number,
    account_notes: string,
    email_address: string,
    is_application_accepted: boolean,
    is_seed_account: boolean,
    password_hash: string,
    password_salt: string,
  },
  age_group: {
    age_group: string,
    is_child: boolean,
  },
  attendee: {
    age_group: string | null,
    associated_account_id: number,
    attendee_id: number,
    dietary_restrictions: string,
    discord_handle: string | null,
    interested_in_pre_call: boolean,
    interested_in_volunteering: boolean,
    name: string | null,
    notes: string,
    planning_to_camp: boolean,
  },
  event: {
    created_by_account_id: number,
    description: string,
    end: unknown | null,
    event_id: number,
    location: string | null,
    name: string,
    start: unknown,
  },
  festival: {
    end_date: unknown,
    festival_id: number,
    festival_name: string,
    festival_site_id: number,
    start_date: unknown,
  },
  festival_site: {
    festival_site_id: number,
    festival_site_name: string,
    location: unknown,
  },
  invite_code: {
    code: string,
    created_by_account_id: number,
    festival_id: number,
    invite_code_id: number,
    used_by_account_id: number | null,
  },
  next_festival: {
    end_date: unknown | null,
    festival_id: number | null,
    festival_name: string | null,
    festival_site_id: number | null,
    start_date: unknown | null,
  },
  purchase: {
    assigned_to_attendee_id: number | null,
    owned_by_account_id: number | null,
    purchase_id: number,
    purchase_type_id: number,
    purchased_on: unknown,
  },
  purchase_type: {
    festival_id: number,
    max_available: number | null,
    price_in_cents: number,
    purchase_type: string,
    purchase_type_id: number,
  },
}

export type TableName = keyof Tables

export const TABLE_ROWS = {
  purchase_type: [
    {"purchase_type":"SLEEPING_BAG","price_in_cents":1200,"festival_id":1,"purchase_type_id":2,"max_available":null},
    {"purchase_type":"BUS","price_in_cents":1200,"festival_id":1,"purchase_type_id":3,"max_available":null},
    {"purchase_type":"ATTENDANCE","price_in_cents":12300,"festival_id":1,"purchase_type_id":1,"max_available":600},
  ],
}