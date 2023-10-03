export interface Account {
  account_id: number;
  email_address: string;
  password_hash: string;
  password_salt: string;
  account_notes: string;
  is_seed_account: boolean;
  invite_code_id: number;
}

export interface Attendee {
  attendee_id: number;
  name: string;
  is_child: boolean;
  dietary_restrictions: string;
  has_purchased_bedding: boolean;
  has_purchased_bus_ticket: string;
  attendee_notes: string;
  associated_account_id: number;
  is_default_for_account: boolean;
}

export interface Cabin {
  cabin_id: number;
  event_site_id: number;
  cabin_name: string;
  total_beds: number;
}

export interface Event {
  event_id: number;
  event_name: string;
  event_site_id: number;
  year: number;
}

export interface EventSite {
  event_site_id: number;
  event_site_name: string;
}

export interface InviteCode {
  invite_code_id: number;
  code: string;
  created_by_account_id: number;
}

export interface Ticket {
  ticket_id: number;
  event_id: number;
  owned_by_account_id: number;
  assigned_to_attendee_id: number;
}
