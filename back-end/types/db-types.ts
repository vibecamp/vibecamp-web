/**
 * NOTE: This file is generated automatically by generate-db-types.ts, it
 * should not be modified manually!
 */

export type Tables = {
  account: {
    account_id: string,
    application_id: Tables['application']['application_id'] | null,
    email_address: string,
    is_authorized_to_buy_tickets: boolean | null,
    is_seed_account: boolean,
    is_team_member: boolean,
    notes: string,
    password_hash: string | null,
    password_salt: string | null,
  },
  age_range: (typeof TABLE_ROWS)['age_range'][number]
  application: {
    anything_else: string,
    application_id: string,
    attractive_virtues: string,
    experiences_hoping_to_share: string,
    group_activity: string,
    hoping_to_get_out_of_the_festival: string,
    how_found_out: string,
    identify_as: string,
    interested_in_volunteering: boolean | null,
    is_accepted: boolean | null,
    last_conversation: string,
    looking_forward_to_conversations: string,
    name: string,
    previous_events: string,
    strongest_virtues: string,
    submitted_on: Date,
    twitter_handle: string | null,
  },
  attendee: {
    age: number | null,
    age_range: Tables['age_range']['age_range'] | null,
    associated_account_id: Tables['account']['account_id'],
    attendee_id: string,
    diet: Tables['diet']['diet_id'] | null,
    discord_handle: string | null,
    festival_id: Tables['festival']['festival_id'],
    has_allergy_eggs: boolean | null,
    has_allergy_fish: boolean | null,
    has_allergy_milk: boolean | null,
    has_allergy_peanuts: boolean | null,
    has_allergy_shellfish: boolean | null,
    has_allergy_soy: boolean | null,
    has_allergy_tree_nuts: boolean | null,
    has_allergy_wheat: boolean | null,
    interested_in_pre_call: boolean,
    interested_in_volunteering_as: Tables['volunteer_type']['volunteer_type_id'] | null,
    is_primary_for_account: boolean,
    medical_training: string | null,
    name: string,
    notes: string,
    planning_to_camp: boolean,
    twitter_handle: string | null,
  },
  diet: (typeof TABLE_ROWS)['diet'][number]
  discount: {
    discount_code: string,
    discount_id: string,
    price_multiplier: string,
    purchase_type_id: Tables['purchase_type']['purchase_type_id'],
  },
  event: {
    created_by_account_id: Tables['account']['account_id'],
    description: string,
    end_datetime: Date | null,
    event_id: string,
    event_site_location: Tables['event_site']['event_site_id'] | null,
    event_type: Tables['event_type']['event_type_id'],
    name: string,
    plaintext_location: string | null,
    start_datetime: Date,
  },
  event_bookmark: {
    account_id: Tables['account']['account_id'],
    event_id: Tables['event']['event_id'],
  },
  event_site: {
    can_host_multiple_events: boolean,
    description: string | null,
    equipment: string | null,
    event_site_id: string,
    festival_site_id: Tables['festival_site']['festival_site_id'],
    location: unknown | null,
    name: string,
    people_cap: number | null,
    structure_type: string,
    theme: string | null,
  },
  event_type: (typeof TABLE_ROWS)['event_type'][number]
  festival: {
    email_banner_image: string | null,
    end_date: Date,
    festival_id: string,
    festival_name: string,
    festival_site_id: Tables['event_site']['festival_site_id'],
    info_url: string | null,
    sales_are_open: boolean,
    start_date: Date,
  },
  festival_site: {
    festival_site_id: string,
    festival_site_name: string,
    location: unknown,
  },
  invite_code: {
    code: string,
    created_by_account_id: Tables['account']['account_id'],
    festival_id: Tables['attendee']['festival_id'] | null,
    used_by_account_id: Tables['account']['account_id'] | null,
  },
  purchase: {
    checked_in: boolean | null,
    owned_by_account_id: Tables['account']['account_id'] | null,
    purchase_id: string,
    purchase_type_id: Tables['discount']['purchase_type_id'],
    purchased_on: Date,
    stripe_payment_intent: string | null,
  },
  purchase_type: {
    available_from: Date | null,
    available_to: Date | null,
    description: string,
    festival_id: Tables['attendee']['festival_id'],
    is_attendance_ticket: boolean,
    max_available: number | null,
    max_per_account: number | null,
    price_in_cents: number,
    purchase_type_id: string,
  },
  volunteer_type: (typeof TABLE_ROWS)['volunteer_type'][number]
}

export type TableName = keyof Tables

export const TABLE_ROWS = {
  age_range: [
    {"age_range":"18_TO_21","description":"Between 18 and 21","start":18,"end":21},
    {"age_range":"21_OR_OVER","description":"21 or over","start":21,"end":null},
    {"age_range":"UNDER_18","description":"Under 18","start":0,"end":18},
  ],
  diet: [
    {"diet_id":"NO_RESTRICTIONS","description":"No restrictions"},
    {"diet_id":"VEGAN","description":"Vegan"},
    {"diet_id":"VEGETARIAN","description":"Vegetarian"},
  ],
  event_type: [
    {"event_type_id":"CAMPSITE_OFFICIAL"},
    {"event_type_id":"TEAM_OFFICIAL"},
    {"event_type_id":"UNOFFICIAL"},
  ],
  volunteer_type: [
    {"volunteer_type_id":"FAE","description":"Fae"},
    {"volunteer_type_id":"GENERAL","description":"General volunteer"},
  ],
} as const