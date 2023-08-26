import type { ColumnType } from "kysely";

export type Generated<T> = T extends ColumnType<infer S, infer I, infer U>
  ? ColumnType<S, I | undefined, U>
  : ColumnType<T, T | undefined, T>;

export interface Account {
  account_id: Generated<number>;
  email_address: string;
  password_hash: string;
  password_salt: string;
  general_notes: Generated<string>;
}

export interface AccountAttendee {
  "account_attendee _id": Generated<number>;
  account_id: number;
  attendee_id: number;
  is_default_for_account: boolean;
}

export interface Attendee {
  attendee_id: Generated<number>;
  name: string;
  is_child: boolean;
  dietary_restrictions: Generated<string>;
  has_purchased_bedding: Generated<boolean>;
  has_purchased_bus_ticket: Generated<string>;
  general_notes: Generated<string>;
  ticket_id: number;
}

export interface Cabin {
  cabin_id: Generated<number>;
  event_site_id: number;
  cabin_name: string;
  total_beds: number;
}

export interface Event {
  event_id: Generated<number>;
  event_name: string;
  event_site_id: number;
  year: number;
}

export interface EventSite {
  event_site_id: Generated<number>;
  event_site_name: string;
}

export interface Ticket {
  ticket_id: Generated<number>;
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
