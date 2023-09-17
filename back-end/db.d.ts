export interface Account {
  account_id: number;
  email_address: string;
  password_hash: string;
  password_salt: string;
  general_notes: string;
}

export interface AccountAttendee {
  account_attendee_id: number;
  account_id: number;
  attendee_id: number;
  is_default_for_account: boolean;
}

export interface Attendee {
  attendee_id: number;
  name: string;
  is_child: boolean;
  dietary_restrictions: string;
  has_purchased_bedding: boolean;
  has_purchased_bus_ticket: string;
  general_notes: string;
  ticket_id: number;
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

export interface Ticket {
  ticket_id: number;
  event_id: number;
}

export interface DB {
  account: Account;
  account_attendee: AccountAttendee;
  attendee: Attendee;
  cabin: Cabin;
  event: Event;
  event_site: EventSite;
  ticket: Ticket;
}
