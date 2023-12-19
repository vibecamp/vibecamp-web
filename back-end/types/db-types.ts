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
  event_site: (typeof TABLE_ROWS)['event_site'][number]
  festival: (typeof TABLE_ROWS)['festival'][number]
  festival_site: (typeof TABLE_ROWS)['festival_site'][number]
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
  festival: [
    {"festival_name":"Vibecamp 2024","start_date":"2024-06-15T05:00:00.000Z","end_date":"2024-06-18T05:00:00.000Z","festival_id":"4821bd6a-9e16-4944-b9a1-afe3256ff18d","festival_site_id":"8983e8b4-b3f8-4420-ba65-2f7fa757ec1a","info_url":null},
    {"festival_name":"Vibeclipse 2024","start_date":"2024-04-05T05:00:00.000Z","end_date":"2024-04-08T05:00:00.000Z","festival_id":"a1fe0c91-5087-48d6-87b9-bdc1ef3716a6","festival_site_id":"14f673c9-53d2-44f8-86f6-38ca26386864","info_url":"https://vibe.camp/vibeclipse_home/"},
  ],
  festival_site: [
    {"festival_site_name":"Camp Ramblewood","location":{"x":"39.645899","y":"-76.172219"},"festival_site_id":"8983e8b4-b3f8-4420-ba65-2f7fa757ec1a"},
    {"festival_site_name":"Camp Champions","location":{"x":"30.608632","y":"-98.401571"},"festival_site_id":"14f673c9-53d2-44f8-86f6-38ca26386864"},
  ],
  event_site: [
    {"event_site_id":"08672e71-9126-4518-9b83-b0c68f5396ac","festival_site_id":"14f673c9-53d2-44f8-86f6-38ca26386864","location":{"x":"30.6087","y":"-98.4023"},"name":"Sports Field","description":"Behind the Fillin' Station, North of Boys Cabins","can_host_multiple_events":true,"theme":"play","equipment":null,"people_cap":null,"structure_type":"open sky"},
    {"event_site_id":"b18c9dad-56f8-41ea-83d3-a83f8253278b","festival_site_id":"14f673c9-53d2-44f8-86f6-38ca26386864","location":null,"name":"Cabin","description":null,"can_host_multiple_events":false,"theme":null,"equipment":null,"people_cap":null,"structure_type":"indoors"},
    {"event_site_id":"c1f181c8-d846-43f1-9de3-dc98ef05c207","festival_site_id":"14f673c9-53d2-44f8-86f6-38ca26386864","location":{"x":"30.6066","y":"-98.4008"},"name":"Forum","description":"Cement Forum Between Girls Cabins and Hearth","can_host_multiple_events":false,"theme":null,"equipment":null,"people_cap":null,"structure_type":"open sky"},
    {"event_site_id":"794508ae-acb6-4f0d-9a71-2a726fcd54dc","festival_site_id":"14f673c9-53d2-44f8-86f6-38ca26386864","location":{"x":"30.6069","y":"-98.4022"},"name":"Coliseum","description":"Cement Forum Near boys cabins","can_host_multiple_events":false,"theme":null,"equipment":null,"people_cap":null,"structure_type":"open sky"},
    {"event_site_id":"d2a6f4b1-90d5-49a3-bf41-d8f4e54fd462","festival_site_id":"14f673c9-53d2-44f8-86f6-38ca26386864","location":{"x":"30.6072","y":"-98.4023"},"name":"Parthenon","description":"Roof court with bleachers near boys cabins","can_host_multiple_events":false,"theme":null,"equipment":"Mic stand, mic, and speaker (supports voice amplification)","people_cap":null,"structure_type":"roofed, exposed sides"},
    {"event_site_id":"82724b87-3587-493c-9d2f-533721990fef","festival_site_id":"14f673c9-53d2-44f8-86f6-38ca26386864","location":{"x":"30.071","y":"-98.401"},"name":"Hearthtop","description":"Top of the hearth","can_host_multiple_events":false,"theme":null,"equipment":null,"people_cap":null,"structure_type":"open sky"},
    {"event_site_id":"84a9f891-ed0f-4e07-a657-a005d5755922","festival_site_id":"14f673c9-53d2-44f8-86f6-38ca26386864","location":{"x":"30.6072","y":"-98.4011"},"name":"Hearth 2","description":null,"can_host_multiple_events":false,"theme":null,"equipment":null,"people_cap":20,"structure_type":"indoors"},
    {"event_site_id":"842b1e43-cf89-4678-a211-c6f640952cc6","festival_site_id":"14f673c9-53d2-44f8-86f6-38ca26386864","location":{"x":"30.6069","y":"-98.4009"},"name":"Greene Hall","description":null,"can_host_multiple_events":false,"theme":null,"equipment":null,"people_cap":100,"structure_type":"indoors"},
    {"event_site_id":"b7c2aa4f-77d4-41b2-b215-fa4b0c18e589","festival_site_id":"14f673c9-53d2-44f8-86f6-38ca26386864","location":{"x":"30.6074","y":"-98.4012"},"name":"Hearth 1","description":null,"can_host_multiple_events":false,"theme":null,"equipment":null,"people_cap":20,"structure_type":"indoors"},
    {"event_site_id":"9da0c56a-fd43-4eb8-9975-5aabd11c90b1","festival_site_id":"14f673c9-53d2-44f8-86f6-38ca26386864","location":{"x":"30.6065","y":"-98.4002"},"name":"Town Hall","description":"Building East edge of camp just north of girls cabins","can_host_multiple_events":false,"theme":"movement","equipment":"Mic stand, mic, and speaker (supports voice amplification)","people_cap":175,"structure_type":"indoors"},
    {"event_site_id":"484c6d27-9d53-4ade-8006-d7ff1c468ae3","festival_site_id":"14f673c9-53d2-44f8-86f6-38ca26386864","location":{"x":"30.607","y":"-98.4001"},"name":"Hearth 4","description":null,"can_host_multiple_events":false,"theme":null,"equipment":null,"people_cap":20,"structure_type":"indoors"},
    {"event_site_id":"5ae504f9-8c10-4f11-9fb0-172156ef552e","festival_site_id":"14f673c9-53d2-44f8-86f6-38ca26386864","location":{"x":"30.6068","y":"-98.3999"},"name":"Olympia","description":"Roofed area at east edge of camp, near tennis courts","can_host_multiple_events":false,"theme":null,"equipment":null,"people_cap":null,"structure_type":"roofed, exposed sides"},
    {"event_site_id":"07d0bf18-92fd-438d-a8bb-ae16caeb8b43","festival_site_id":"14f673c9-53d2-44f8-86f6-38ca26386864","location":{"x":"30.6071","y":"-98.4001"},"name":"Hearth 3","description":null,"can_host_multiple_events":false,"theme":null,"equipment":null,"people_cap":20,"structure_type":"indoors"},
    {"event_site_id":"9c14f150-23d5-46ca-872b-9ba0f4eef78b","festival_site_id":"14f673c9-53d2-44f8-86f6-38ca26386864","location":{"x":"30.6064","y":"-98.4002"},"name":"Cabin 7-11","description":"Just South of Town Hall","can_host_multiple_events":false,"theme":null,"equipment":null,"people_cap":null,"structure_type":"indoors"},
  ],
} as const