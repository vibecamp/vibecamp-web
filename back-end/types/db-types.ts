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
    notes: string,
    password_hash: string | null,
    password_salt: string | null,
  },
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
  event: {
    created_by_account_id: Tables['account']['account_id'],
    description: string,
    end_datetime: Date | null,
    event_id: string,
    location: string | null,
    name: string,
    start_datetime: Date,
  },
  event_bookmark: {
    account_id: Tables['account']['account_id'],
    event_id: Tables['event']['event_id'],
  },
  festival: {
    end_date: Date,
    festival_id: string,
    festival_name: string,
    festival_site_id: Tables['festival_site']['festival_site_id'],
    info_url: string | null,
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
    festival_id: Tables['attendee']['festival_id'],
    used_by_account_id: Tables['account']['account_id'] | null,
  },
  next_festival: (typeof TABLE_ROWS)['next_festival'][number]
  purchase: {
    owned_by_account_id: Tables['account']['account_id'] | null,
    purchase_id: string,
    purchase_type_id: Tables['purchase_type']['purchase_type_id'],
    purchased_on: Date,
  },
  purchase_type: (typeof TABLE_ROWS)['purchase_type'][number]
  volunteer_type: (typeof TABLE_ROWS)['volunteer_type'][number]
}

export type TableName = keyof Tables

export const TABLE_ROWS = {
  purchase_type: [
    {"purchase_type_id":"SLEEPING_BAG_VIBECLIPSE_2024","price_in_cents":3500,"max_available":null,"description":"Sleeping bag","max_per_account":null,"festival_id":"a1fe0c91-5087-48d6-87b9-bdc1ef3716a6"},
    {"purchase_type_id":"PILLOW_WITH_CASE_VIBECLIPSE_2024","price_in_cents":2000,"max_available":null,"description":"Pillow (with pillowcase)","max_per_account":null,"festival_id":"a1fe0c91-5087-48d6-87b9-bdc1ef3716a6"},
    {"purchase_type_id":"BUS_330PM_VIBECLIPSE_2024","price_in_cents":6000,"max_available":null,"description":"Bus leaving AUS at 3:30 PM CST (meet at 3:00)","max_per_account":null,"festival_id":"a1fe0c91-5087-48d6-87b9-bdc1ef3716a6"},
    {"purchase_type_id":"BUS_730PM_VIBECLIPSE_2024","price_in_cents":6000,"max_available":50,"description":"Bus leaving AUS at 7:30 PM CST (meet at 7:15, 50 available)","max_per_account":null,"festival_id":"a1fe0c91-5087-48d6-87b9-bdc1ef3716a6"},
    {"purchase_type_id":"BUS_430PM_VIBECLIPSE_2024","price_in_cents":6000,"max_available":null,"description":"Bus leaving AUS at 4:30 PM CST (meet at 4:00)","max_per_account":null,"festival_id":"a1fe0c91-5087-48d6-87b9-bdc1ef3716a6"},
    {"purchase_type_id":"BUS_830PM_VIBECLIPSE_2024","price_in_cents":6000,"max_available":50,"description":"Bus leaving AUS at 8:30 PM CST (meet at 8:15, 50 available)","max_per_account":null,"festival_id":"a1fe0c91-5087-48d6-87b9-bdc1ef3716a6"},
    {"purchase_type_id":"ATTENDANCE_VIBECLIPSE_2024_OVER_16","price_in_cents":55000,"max_available":600,"description":"Ticket","max_per_account":2,"festival_id":"a1fe0c91-5087-48d6-87b9-bdc1ef3716a6"},
    {"purchase_type_id":"ATTENDANCE_VIBECLIPSE_2024_10_TO_16","price_in_cents":33000,"max_available":null,"description":"Ticket (ages 10 to 16)","max_per_account":5,"festival_id":"a1fe0c91-5087-48d6-87b9-bdc1ef3716a6"},
    {"purchase_type_id":"ATTENDANCE_VIBECLIPSE_2024_5_TO_10","price_in_cents":20000,"max_available":null,"description":"Ticket (ages 5 to 10)","max_per_account":5,"festival_id":"a1fe0c91-5087-48d6-87b9-bdc1ef3716a6"},
    {"purchase_type_id":"ATTENDANCE_VIBECLIPSE_2024_2_TO_5","price_in_cents":10000,"max_available":null,"description":"Ticket (ages 2 to 5)","max_per_account":5,"festival_id":"a1fe0c91-5087-48d6-87b9-bdc1ef3716a6"},
  ],
  volunteer_type: [
    {"volunteer_type_id":"FAE","description":"Fae"},
    {"volunteer_type_id":"GENERAL","description":"General volunteer"},
  ],
  diet: [
    {"diet_id":"VEGETARIAN","description":"Vegetarian"},
    {"diet_id":"VEGAN","description":"Vegan"},
    {"diet_id":"NO_RESTRICTIONS","description":"No restrictions"},
  ],
  next_festival: [
    {"festival_id":"a1fe0c91-5087-48d6-87b9-bdc1ef3716a6","festival_name":"Vibeclipse 2024","festival_site_id":"14f673c9-53d2-44f8-86f6-38ca26386864","start_date":"2024-04-05T05:00:00.000Z","end_date":"2024-04-08T05:00:00.000Z","info_url":"https://vibe.camp/vibeclipse_home/"},
  ],
} as const