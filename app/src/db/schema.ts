// Generated from the migrated database; edit migrations instead.
import type { PgTableExtraConfigValue } from "drizzle-orm/pg-core"
import { pgTable, uuid, text, timestamp, boolean, unique, integer, foreignKey, index, uniqueIndex, date, point, doublePrecision, check, type AnyPgColumn, jsonb, primaryKey, pgView, customType } from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"

const bytea = customType<{ data: Buffer; driverData: Buffer }>({ dataType() { return "bytea" } })



export const announcement = pgTable("announcement", {
	announcement_id: uuid().defaultRandom().primaryKey().notNull(),
	title: text().notNull(),
	content: text().notNull(),
	announced_at: timestamp({ withTimezone: true, mode: 'string' }).defaultNow().notNull(),
});

export const application = pgTable("application", {
	application_id: uuid().defaultRandom().primaryKey().notNull(),
	is_accepted: boolean(),
	submitted_on: timestamp({ withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	name: text().notNull(),
	twitter_handle: text(),
	hoping_to_get_out_of_the_festival: text().notNull(),
	experiences_hoping_to_share: text().notNull(),
	identify_as: text().notNull(),
	looking_forward_to_conversations: text().notNull(),
	last_conversation: text().notNull(),
	strongest_virtues: text().notNull(),
	attractive_virtues: text().notNull(),
	group_activity: text().notNull(),
	interested_in_volunteering: boolean(),
	how_found_out: text().notNull(),
	previous_events: text().notNull(),
	anything_else: text().notNull(),
});

export const account = pgTable("account", {
	email_address: text().notNull(),
	password_hash: text(),
	password_salt: text(),
	notes: text().default('\'').notNull(),
	account_id: uuid().defaultRandom().primaryKey().notNull(),
}, (table): PgTableExtraConfigValue[] => [
	unique("account_email_address_key").on(table.email_address),
]);

export const age_range = pgTable("age_range", {
	age_range: text().primaryKey().notNull(),
	description: text().notNull(),
	start: integer(),
	end: integer(),
});

export const attendee = pgTable("attendee", {
	name: text().notNull(),
	notes: text().default('\'').notNull(),
	discord_handle: text(),
	interested_in_pre_call: boolean().default(false).notNull(),
	planning_to_camp: boolean().default(false).notNull(),
	twitter_handle: text(),
	medical_training: text(),
	interested_in_volunteering_as: text(),
	diet: text(),
	has_allergy_milk: boolean(),
	has_allergy_eggs: boolean(),
	has_allergy_fish: boolean(),
	has_allergy_shellfish: boolean(),
	has_allergy_tree_nuts: boolean(),
	has_allergy_peanuts: boolean(),
	has_allergy_wheat: boolean(),
	has_allergy_soy: boolean(),
	is_primary_for_account: boolean().default(false).notNull(),
	associated_account_id: uuid().notNull(),
	attendee_id: uuid().defaultRandom().primaryKey().notNull(),
	age: integer(),
	age_range: text(),
	share_ticket_status_with_selflathing: boolean(),
	phone_number: text(),
	email_address: text(),
}, (table): PgTableExtraConfigValue[] => [
	foreignKey({
			columns: [table.age_range],
			foreignColumns: [age_range.age_range],
			name: "attendee_age_range_fkey"
		}),
	foreignKey({
			columns: [table.associated_account_id],
			foreignColumns: [account.account_id],
			name: "attendee_associated_account_id_fkey"
		}),
	foreignKey({
			columns: [table.interested_in_volunteering_as],
			foreignColumns: [volunteer_type.volunteer_type_id],
			name: "attendee_interested_in_volunteering_fkey"
		}),
	foreignKey({
			columns: [table.diet],
			foreignColumns: [diet.diet_id],
			name: "attendee_special_diet_fkey"
		}),
]);

export const attendee_cabin = pgTable("attendee_cabin", {
	attendee_id: uuid().notNull(),
	cabin_id: uuid().notNull(),
	festival_id: uuid().notNull(),
}, (table): PgTableExtraConfigValue[] => [
	foreignKey({
			columns: [table.attendee_id],
			foreignColumns: [attendee.attendee_id],
			name: "attendee_cabin_attendee_id_fkey"
		}),
	foreignKey({
			columns: [table.cabin_id],
			foreignColumns: [cabin.cabin_id],
			name: "attendee_cabin_cabin_id_fkey"
		}),
	foreignKey({
			columns: [table.festival_id],
			foreignColumns: [festival.festival_id],
			name: "attendee_cabin_festival_id_fkey"
		}),
	unique("unique_attendee_festival").on(table.attendee_id, table.festival_id),
]);

export const cabin = pgTable("cabin", {
	cabin_id: uuid().defaultRandom().primaryKey().notNull(),
	name: text().notNull(),
	max_occupancy: integer(),
	nickname: text(),
	festival_site_id: uuid().notNull(),
	notes: text(),
}, (table): PgTableExtraConfigValue[] => [
	index("fki_cabin_festival_site_id").using("btree", table.festival_site_id.asc().nullsLast().op("uuid_ops")),
	index("fki_cabin_festival_site_id_fkey").using("btree", table.festival_site_id.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.festival_site_id],
			foreignColumns: [festival_site.festival_site_id],
			name: "cabin_festival_site_id_fkey"
		}),
]);

export const festival = pgTable("festival", {
	festival_name: text().notNull(),
	start_date: date().notNull(),
	end_date: date().notNull(),
	festival_id: uuid().defaultRandom().primaryKey().notNull(),
	festival_site_id: uuid().notNull(),
	info_url: text(),
	sales_are_open: boolean().default(false).notNull(),
	email_banner_image: text(),
	pre_badge_integration: boolean().default(false).notNull(),
}, (table): PgTableExtraConfigValue[] => [
	uniqueIndex("one_selling_festival").using("btree", sql`(true)`).where(sql`sales_are_open`),
	foreignKey({
			columns: [table.festival_site_id],
			foreignColumns: [festival_site.festival_site_id],
			name: "festival_festival_site_id_fkey"
		}),
	unique("festival_festival_name_key").on(table.festival_name),
]);

export const volunteer_type = pgTable("volunteer_type", {
	volunteer_type_id: text().primaryKey().notNull(),
	description: text().notNull(),
});

export const diet = pgTable("diet", {
	diet_id: text().primaryKey().notNull(),
	description: text().notNull(),
});

export const badge_info = pgTable("badge_info", {
	badge_info_id: uuid().defaultRandom().primaryKey().notNull(),
	attendee_id: uuid().notNull(),
	festival_id: uuid().notNull(),
	badge_name: text().notNull(),
	badge_username: text(),
	badge_bio: text(),
	badge_location: text(),
	badge_picture_url: text(),
	badge_picture_image_id: uuid(),
	attended_vc_1: boolean(),
	attended_vc_2: boolean(),
}, (table): PgTableExtraConfigValue[] => [
	index("attendee_id").using("btree", table.attendee_id.asc().nullsLast().op("uuid_ops")),
	index("festival_id").using("btree", table.festival_id.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.attendee_id],
			foreignColumns: [attendee.attendee_id],
			name: "badge_info_attendee_id_fkey"
		}),
	foreignKey({
			columns: [table.badge_picture_image_id],
			foreignColumns: [stored_image.stored_image_id],
			name: "badge_info_badge_picture_image_id_fkey"
		}),
	foreignKey({
			columns: [table.festival_id],
			foreignColumns: [festival.festival_id],
			name: "badge_info_festival_id_fkey"
		}),
]);

export const stored_image = pgTable("stored_image", {
	stored_image_id: uuid().defaultRandom().primaryKey().notNull(),
	owned_by_account_id: uuid(),
	image_data: bytea("image_data").notNull(),
}, (table): PgTableExtraConfigValue[] => [
	foreignKey({
			columns: [table.owned_by_account_id],
			foreignColumns: [account.account_id],
			name: "stored_image_owned_by_account_id_fkey"
		}),
]);

export const festival_site = pgTable("festival_site", {
	festival_site_name: text().notNull(),
	location: point().notNull(),
	festival_site_id: uuid().defaultRandom().primaryKey().notNull(),
}, (table): PgTableExtraConfigValue[] => [
	unique("festival_site_festival_site_name_key").on(table.festival_site_name),
]);

export const discount = pgTable("discount", {
	discount_id: uuid().defaultRandom().primaryKey().notNull(),
	discount_code: text().notNull(),
	purchase_type_id: text().notNull(),
	price_multiplier: doublePrecision().notNull(),
}, (table): PgTableExtraConfigValue[] => [
	foreignKey({
			columns: [table.purchase_type_id],
			foreignColumns: [purchase_type.purchase_type_id],
			name: "discount_purchase_type_id_fkey"
		}),
]);

export const event_bookmark = pgTable("event_bookmark", {
	account_id: uuid().notNull(),
	event_id: uuid().notNull(),
}, (table): PgTableExtraConfigValue[] => [
	index("event_bookmark_account_id_idx").using("btree", table.account_id.asc().nullsLast().op("uuid_ops")),
	index("event_bookmark_event_id_idx").using("btree", table.event_id.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.account_id],
			foreignColumns: [account.account_id],
			name: "event_bookmark_account_id_fkey"
		}),
	foreignKey({
			columns: [table.event_id],
			foreignColumns: [event.event_id],
			name: "event_bookmark_event_id_fkey"
		}),
]);

export const event = pgTable("event", {
	name: text().notNull(),
	description: text().notNull(),
	start_datetime: timestamp({ mode: 'string' }).notNull(),
	end_datetime: timestamp({ mode: 'string' }),
	plaintext_location: text(),
	event_id: uuid().defaultRandom().primaryKey().notNull(),
	created_by_account_id: uuid().notNull(),
	event_site_location: uuid(),
	event_type: text().default('UNOFFICIAL').notNull(),
	will_be_filmed: boolean().default(false).notNull(),
	last_modified: timestamp({ withTimezone: true, mode: 'string' }),
	tags: text().array().default(["RAY"]).notNull(),
	av_needs: text(),
}, (table): PgTableExtraConfigValue[] => [
	foreignKey({
			columns: [table.created_by_account_id],
			foreignColumns: [account.account_id],
			name: "event_created_by_account_id_fkey"
		}),
	foreignKey({
			columns: [table.event_site_location],
			foreignColumns: [event_site.event_site_id],
			name: "event_event_site_location_fkey"
		}),
	foreignKey({
			columns: [table.event_type],
			foreignColumns: [event_type.event_type_id],
			name: "event_event_type_fkey"
		}),
]);

export const event_site = pgTable("event_site", {
	event_site_id: uuid().defaultRandom().primaryKey().notNull(),
	festival_site_id: uuid().notNull(),
	location: point(),
	name: text().notNull(),
	description: text(),
	can_host_multiple_events: boolean().notNull(),
	theme: text(),
	equipment: text(),
	people_cap: integer(),
	structure_type: text().notNull(),
	forbidden_for_new_events: boolean().default(false).notNull(),
	is_av_site: boolean().default(false).notNull(),
}, (table): PgTableExtraConfigValue[] => [
	foreignKey({
			columns: [table.festival_site_id],
			foreignColumns: [festival_site.festival_site_id],
			name: "event_site_festival_site_id_fkey"
		}),
]);

export const event_type = pgTable("event_type", {
	event_type_id: text().primaryKey().notNull(),
});

export const faq_node = pgTable("faq_node", {
	faq_node_id: uuid().defaultRandom().primaryKey().notNull(),
	title: text().notNull(),
	content: text(),
	order: integer(),
	parent_faq_node_id: uuid(),
}, (table): PgTableExtraConfigValue[] => [
	foreignKey({
			columns: [table.parent_faq_node_id],
			foreignColumns: [table.faq_node_id],
			name: "faq_node_parent_faq_node_id_fkey"
		}),
]);

export const invite_code = pgTable("invite_code", {
	code: uuid().defaultRandom().primaryKey().notNull(),
	created_by_account_id: uuid().notNull(),
	used_by_account_id: uuid(),
	festival_id: uuid(),
}, (table): PgTableExtraConfigValue[] => [
	foreignKey({
			columns: [table.created_by_account_id],
			foreignColumns: [account.account_id],
			name: "invite_code_created_by_account_id_fkey"
		}),
	foreignKey({
			columns: [table.festival_id],
			foreignColumns: [festival.festival_id],
			name: "invite_code_festival_id_fkey"
		}),
	foreignKey({
			columns: [table.used_by_account_id],
			foreignColumns: [account.account_id],
			name: "invite_code_used_by_account_id_fkey"
		}),
]);

export const account_password_reset_secret = pgTable("account_password_reset_secret", {
	account_password_reset_secret_id: uuid().defaultRandom().primaryKey().notNull(),
	account_id: uuid().notNull(),
	secret: text().notNull(),
	created_at: timestamp({ withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	used_at: timestamp({ withTimezone: true, mode: 'string' }),
}, (table): PgTableExtraConfigValue[] => [
	index("account_password_reset_secret_secret_idx").using("btree", table.secret.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.account_id],
			foreignColumns: [account.account_id],
			name: "account_password_reset_secret_account_id_fkey"
		}),
]);

export const purchase_type = pgTable("purchase_type", {
	purchase_type_id: text().primaryKey().notNull(),
	price_in_cents: integer().notNull(),
	max_available: integer(),
	description: text().notNull(),
	max_per_account: integer(),
	festival_id: uuid().notNull(),
	is_attendance_ticket: boolean().default(false).notNull(),
	available_from: date(),
	available_to: date(),
	hidden_from_ui: boolean().default(false).notNull(),
	low_income_only: boolean().default(false).notNull(),
	sort_order: integer().default(0).notNull(),
	sale_enabled: boolean().default(false).notNull(),
	details: text(),
	additional_info: text(),
	max_per_ticket: integer().default(1),
}, (table): PgTableExtraConfigValue[] => [
	foreignKey({
			columns: [table.festival_id],
			foreignColumns: [festival.festival_id],
			name: "purchase_type_festival_id_fkey"
		}),
	check("product_addon_cap", sql`(max_per_ticket IS NULL) OR (max_per_ticket > 0)`),
]);

export const discount_code = pgTable("discount_code", {
	discount_code_id: uuid().defaultRandom().primaryKey().notNull(),
	festival_id: uuid().notNull(),
	code: text().notNull(),
	enabled: boolean().default(true).notNull(),
	starts_at: timestamp({ withTimezone: true, mode: 'string' }),
	ends_at: timestamp({ withTimezone: true, mode: 'string' }),
	max_uses: integer(),
	percent_bps: integer(),
	fixed_cents: integer(),
}, (table): PgTableExtraConfigValue[] => [
	foreignKey({
			columns: [table.festival_id],
			foreignColumns: [festival.festival_id],
			name: "discount_code_festival_id_fkey"
		}),
	unique("discount_code_festival_id_code_key").on(table.festival_id, table.code),
	check("discount_code_max_uses_check", sql`(max_uses IS NULL) OR (max_uses > 0)`),
	check("discount_code_code_check", sql`(code = upper(btrim(code))) AND (length(code) > 0)`),
	check("discount_code_check", sql`(((percent_bps >= 1) AND (percent_bps <= 10000)) AND (fixed_cents IS NULL)) OR ((percent_bps IS NULL) AND (fixed_cents > 0))`),
	check("discount_code_check1", sql`(percent_bps IS NOT NULL) OR (fixed_cents IS NOT NULL)`),
	check("discount_code_check2", sql`(starts_at IS NULL) OR (ends_at IS NULL) OR (starts_at < ends_at)`),
]);

export const checkout_order = pgTable("checkout_order", {
	checkout_order_id: uuid().defaultRandom().primaryKey().notNull(),
	account_id: uuid().notNull(),
	festival_id: uuid().notNull(),
	target_ticket_id: uuid(),
	request_id: uuid().notNull(),
	cart: jsonb().notNull(),
	quote: jsonb().notNull(),
	stripe_params: jsonb().notNull(),
	status: text().default('pending').notNull(),
	needs_attention: boolean().default(false).notNull(),
	stripe_session_id: text(),
	stripe_url: text(),
	payment_intent: text(),
	stripe_event_id: text(),
	discount_code_id: uuid(),
	discounted_ticket_count: integer().default(0).notNull(),
	created_at: timestamp({ withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	fulfilled_at: timestamp({ withTimezone: true, mode: 'string' }),
}, (table): PgTableExtraConfigValue[] => [
	uniqueIndex("one_pending_addon_order").using("btree", table.target_ticket_id.asc().nullsLast().op("uuid_ops")).where(sql`(status = 'pending'::text)`),
	foreignKey({
			columns: [table.account_id],
			foreignColumns: [account.account_id],
			name: "checkout_order_account_id_fkey"
		}),
	foreignKey({
			columns: [table.festival_id],
			foreignColumns: [festival.festival_id],
			name: "checkout_order_festival_id_fkey"
		}),
	foreignKey({
			columns: [table.target_ticket_id],
			foreignColumns: [purchase.purchase_id],
			name: "checkout_order_target_ticket_id_fkey"
		}),
	foreignKey({
			columns: [table.discount_code_id],
			foreignColumns: [discount_code.discount_code_id],
			name: "checkout_order_discount_code_id_fkey"
		}),
	unique("checkout_order_account_id_request_id_key").on(table.account_id, table.request_id),
	unique("checkout_order_stripe_session_id_key").on(table.stripe_session_id),
	unique("checkout_order_payment_intent_key").on(table.payment_intent),
	check("checkout_order_status_check", sql`status = ANY (ARRAY['pending'::text, 'fulfilled'::text, 'closed'::text])`),
	check("checkout_order_discounted_ticket_count_check", sql`discounted_ticket_count >= 0`),
]);

export const purchase = pgTable("purchase", {
	purchased_on: timestamp({ withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	purchase_type_id: text().notNull(),
	owned_by_account_id: uuid(),
	purchase_id: uuid().defaultRandom().primaryKey().notNull(),
	stripe_payment_intent: text(),
	checked_in: boolean(),
	is_test_purchase: boolean().default(false).notNull(),
	applied_discount: uuid(),
	parent_purchase_id: uuid(),
	checkout_order_id: uuid(),
	gross_price_cents: integer(),
	discount_cents: integer(),
	product_name_snapshot: text(),
	details_snapshot: text(),
	additional_info_snapshot: text(),
}, (table): PgTableExtraConfigValue[] => [
	index("purchase_parent").using("btree", table.parent_purchase_id.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.applied_discount],
			foreignColumns: [discount.discount_id],
			name: "purchase_applied_discount_fkey"
		}),
	foreignKey({
			columns: [table.owned_by_account_id],
			foreignColumns: [account.account_id],
			name: "purchase_owned_by_account_id_fkey"
		}),
	foreignKey({
			columns: [table.purchase_type_id],
			foreignColumns: [purchase_type.purchase_type_id],
			name: "purchase_purchase_type_id_fkey"
		}),
	foreignKey({
			columns: [table.parent_purchase_id],
			foreignColumns: [table.purchase_id],
			name: "purchase_parent_purchase_id_fkey"
		}),
	foreignKey({
			columns: [table.checkout_order_id],
			foreignColumns: [checkout_order.checkout_order_id],
			name: "purchase_checkout_order_id_fkey"
		}),
	check("purchase_gross_price_cents_check", sql`gross_price_cents >= 0`),
	check("purchase_check", sql`(discount_cents >= 0) AND (discount_cents <= gross_price_cents)`),
]);

export const ticket_badge = pgTable("ticket_badge", {
	ticket_id: uuid().primaryKey().notNull(),
	badge_name: text().notNull(),
	badge_username: text(),
	badge_location: text(),
	badge_bio: text(),
	badge_picture_url: text(),
	badge_picture_image_id: uuid(),
}, (table): PgTableExtraConfigValue[] => [
	foreignKey({
			columns: [table.ticket_id],
			foreignColumns: [purchase.purchase_id],
			name: "ticket_badge_ticket_id_fkey"
		}),
	foreignKey({
			columns: [table.badge_picture_image_id],
			foreignColumns: [stored_image.stored_image_id],
			name: "ticket_badge_badge_picture_image_id_fkey"
		}),
	check("ticket_badge_badge_name_check", sql`(length(btrim(badge_name)) >= 1) AND (length(btrim(badge_name)) <= 20)`),
	check("ticket_badge_badge_username_check", sql`(length(badge_username) <= 20) AND (badge_username !~~ '@%'::text)`),
	check("ticket_badge_badge_location_check", sql`length(badge_location) <= 20`),
	check("ticket_badge_badge_bio_check", sql`length(badge_bio) <= 160`),
]);

export const purchase_type_addon = pgTable("purchase_type_addon", {
	ticket_type_id: text().notNull(),
	addon_type_id: text().notNull(),
}, (table): PgTableExtraConfigValue[] => [
	foreignKey({
			columns: [table.ticket_type_id],
			foreignColumns: [purchase_type.purchase_type_id],
			name: "purchase_type_addon_ticket_type_id_fkey"
		}),
	foreignKey({
			columns: [table.addon_type_id],
			foreignColumns: [purchase_type.purchase_type_id],
			name: "purchase_type_addon_addon_type_id_fkey"
		}),
	primaryKey({ columns: [table.ticket_type_id, table.addon_type_id], name: "purchase_type_addon_pkey"}),
]);

export const purchase_type_addon_exclusion = pgTable("purchase_type_addon_exclusion", {
	addon_a: text().notNull(),
	addon_b: text().notNull(),
}, (table): PgTableExtraConfigValue[] => [
	foreignKey({
			columns: [table.addon_a],
			foreignColumns: [purchase_type.purchase_type_id],
			name: "purchase_type_addon_exclusion_addon_a_fkey"
		}),
	foreignKey({
			columns: [table.addon_b],
			foreignColumns: [purchase_type.purchase_type_id],
			name: "purchase_type_addon_exclusion_addon_b_fkey"
		}),
	primaryKey({ columns: [table.addon_a, table.addon_b], name: "purchase_type_addon_exclusion_pkey"}),
	check("purchase_type_addon_exclusion_check", sql`addon_a < addon_b`),
]);

export const discount_code_ticket_type = pgTable("discount_code_ticket_type", {
	discount_code_id: uuid().notNull(),
	purchase_type_id: text().notNull(),
}, (table): PgTableExtraConfigValue[] => [
	foreignKey({
			columns: [table.discount_code_id],
			foreignColumns: [discount_code.discount_code_id],
			name: "discount_code_ticket_type_discount_code_id_fkey"
		}),
	foreignKey({
			columns: [table.purchase_type_id],
			foreignColumns: [purchase_type.purchase_type_id],
			name: "discount_code_ticket_type_purchase_type_id_fkey"
		}),
	primaryKey({ columns: [table.discount_code_id, table.purchase_type_id], name: "discount_code_ticket_type_pkey"}),
]);

export const discount_code_addon_type = pgTable("discount_code_addon_type", {
	discount_code_id: uuid().notNull(),
	purchase_type_id: text().notNull(),
}, (table): PgTableExtraConfigValue[] => [
	foreignKey({
			columns: [table.discount_code_id],
			foreignColumns: [discount_code.discount_code_id],
			name: "discount_code_addon_type_discount_code_id_fkey"
		}),
	foreignKey({
			columns: [table.purchase_type_id],
			foreignColumns: [purchase_type.purchase_type_id],
			name: "discount_code_addon_type_purchase_type_id_fkey"
		}),
	primaryKey({ columns: [table.discount_code_id, table.purchase_type_id], name: "discount_code_addon_type_pkey"}),
]);
export const purchase_sorted = pgView("purchase sorted", {	purchased_on: timestamp({ withTimezone: true, mode: 'string' }),
	purchase_type_id: text(),
	owned_by_account_id: uuid(),
	purchase_id: uuid(),
	stripe_payment_intent: text(),
	checked_in: boolean(),
	is_test_purchase: boolean(),
	applied_discount: uuid(),
}).as(sql`SELECT purchase.purchased_on, purchase.purchase_type_id, purchase.owned_by_account_id, purchase.purchase_id, purchase.stripe_payment_intent, purchase.checked_in, purchase.is_test_purchase, purchase.applied_discount FROM purchase ORDER BY purchase.purchased_on DESC`);