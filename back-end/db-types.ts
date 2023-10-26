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
  age_group: (typeof TABLE_ROWS)['age_group'][number]
  attendee: {
    age_group: string | null,
    associated_account_id: number,
    attendee_id: number,
    discord_handle: string | null,
    has_allergy_eggs: boolean,
    has_allergy_fish: boolean,
    has_allergy_milk: boolean,
    has_allergy_peanuts: boolean,
    has_allergy_shellfish: boolean,
    has_allergy_soy: boolean,
    has_allergy_tree_nuts: boolean,
    has_allergy_wheat: boolean,
    interested_in_pre_call: boolean,
    interested_in_volunteering_as: string | null,
    medical_training: string | null,
    name: string | null,
    notes: string,
    planning_to_camp: boolean,
    special_diet: string | null,
    twitter_handle: string | null,
  },
  diet: (typeof TABLE_ROWS)['diet'][number]
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
    end_date: Date,
    festival_id: number,
    festival_name: string,
    festival_site_id: number,
    start_date: Date,
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
    end_date: Date | null,
    festival_id: number | null,
    festival_name: string | null,
    festival_site_id: number | null,
    start_date: Date | null,
  },
  purchase: {
    assigned_to_attendee_id: number | null,
    owned_by_account_id: number | null,
    purchase_id: number,
    purchase_type_id: string,
    purchased_on: unknown,
  },
  purchase_type: (typeof TABLE_ROWS)['purchase_type'][number]
  volunteer_type: (typeof TABLE_ROWS)['volunteer_type'][number]
}

export type TableName = keyof Tables

export const TABLE_ROWS = {
  purchase_type: [
    { "purchase_type_id": "BUS_VIBECLIPSE_2024", "price_in_cents": 1200, "festival_id": 1, "max_available": null, "description": "Bus ticket (two-way)", "max_per_account": null },
    { "purchase_type_id": "SLEEPING_BAG_VIBECLIPSE_2024", "price_in_cents": 1200, "festival_id": 1, "max_available": null, "description": "Sleeping bag", "max_per_account": null },
    { "purchase_type_id": "ATTENDANCE_VIBECLIPSE_2024", "price_in_cents": 12300, "festival_id": 1, "max_available": 600, "description": "Adult Ticket", "max_per_account": 2 },
    { "purchase_type_id": "ATTENDANCE_CHILD_VIBECLIPSE_2024", "price_in_cents": 12300, "festival_id": 1, "max_available": null, "description": "Child Ticket", "max_per_account": 4 },
  ],
  volunteer_type: [
    { "volunteer_type_id": "FAE", "description": "Fae" },
    { "volunteer_type_id": "GENERAL", "description": "General volunteer" },
  ],
  age_group: [
    { "age_group": "BETWEEN_2_AND_18", "is_child": true, "description": "Between 2 and 18 years old" },
    { "age_group": "UNDER_2", "is_child": true, "description": "Under 2 years old" },
    { "age_group": "BETWEEN_18_AND_21", "is_child": false, "description": "Between 18 and 21 years old" },
    { "age_group": "OVER_21", "is_child": false, "description": "Over 21 years old" },
  ],
  diet: [
    { "diet_id": "VEGETARIAN", "description": "Vegetarian" },
    { "diet_id": "VEGAN", "description": "Vegan" },
  ],
} as const