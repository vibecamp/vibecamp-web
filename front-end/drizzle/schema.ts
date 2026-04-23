import { pgTable, text, index, foreignKey, uuid, boolean, integer, timestamp, date, point, doublePrecision, pgView } from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"



export const volunteerType = pgTable("volunteer_type", {
	volunteerTypeId: text("volunteer_type_id").notNull(),
	description: text().notNull(),
});

export const eventBookmark = pgTable("event_bookmark", {
	accountId: uuid("account_id").notNull(),
	eventId: uuid("event_id").notNull(),
}, (table) => [
	index("event_bookmark_account_id_idx").using("btree", table.accountId.asc().nullsLast().op("uuid_ops")),
	index("event_bookmark_event_id_idx").using("btree", table.eventId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.accountId],
			foreignColumns: [account.accountId],
			name: "event_bookmark_account_id_fkey"
		}),
	foreignKey({
			columns: [table.eventId],
			foreignColumns: [event.eventId],
			name: "event_bookmark_event_id_fkey"
		}),
]);

export const account = pgTable("account", {
	emailAddress: text("email_address").notNull(),
	passwordHash: text("password_hash"),
	passwordSalt: text("password_salt"),
	notes: text().default('\'').notNull(),
	isSeedAccount: boolean("is_seed_account").default(false).notNull(),
	accountId: uuid("account_id").defaultRandom().notNull(),
	isAuthorizedToBuyTickets: boolean("is_authorized_to_buy_tickets"),
	applicationId: uuid("application_id"),
	isTeamMember: boolean("is_team_member").default(false).notNull(),
	isLowIncome: boolean("is_low_income").default(false).notNull(),
}, (table) => [
	foreignKey({
			columns: [table.applicationId],
			foreignColumns: [application.applicationId],
			name: "account_application_id_fkey"
		}),
]);

export const ageRange = pgTable("age_range", {
	ageRange: text("age_range").notNull(),
	description: text().notNull(),
	start: integer(),
	end: integer(),
});

export const application = pgTable("application", {
	applicationId: uuid("application_id").defaultRandom().notNull(),
	isAccepted: boolean("is_accepted"),
	submittedOn: timestamp("submitted_on", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	name: text().notNull(),
	twitterHandle: text("twitter_handle"),
	hopingToGetOutOfTheFestival: text("hoping_to_get_out_of_the_festival").notNull(),
	experiencesHopingToShare: text("experiences_hoping_to_share").notNull(),
	identifyAs: text("identify_as").notNull(),
	lookingForwardToConversations: text("looking_forward_to_conversations").notNull(),
	lastConversation: text("last_conversation").notNull(),
	strongestVirtues: text("strongest_virtues").notNull(),
	attractiveVirtues: text("attractive_virtues").notNull(),
	groupActivity: text("group_activity").notNull(),
	interestedInVolunteering: boolean("interested_in_volunteering"),
	howFoundOut: text("how_found_out").notNull(),
	previousEvents: text("previous_events").notNull(),
	anythingElse: text("anything_else").notNull(),
});

export const purchaseType = pgTable("purchase_type", {
	purchaseTypeId: text("purchase_type_id").notNull(),
	priceInCents: integer("price_in_cents").notNull(),
	maxAvailable: integer("max_available"),
	description: text().notNull(),
	maxPerAccount: integer("max_per_account"),
	festivalId: uuid("festival_id").notNull(),
	isAttendanceTicket: boolean("is_attendance_ticket").default(false).notNull(),
	availableFrom: date("available_from"),
	availableTo: date("available_to"),
	hiddenFromUi: boolean("hidden_from_ui").default(false).notNull(),
	lowIncomeOnly: boolean("low_income_only").default(false).notNull(),
	sortOrder: integer("sort_order").default(0).notNull(),
}, (table) => [
	foreignKey({
			columns: [table.festivalId],
			foreignColumns: [festival.festivalId],
			name: "purchase_type_festival_id_fkey"
		}),
]);

export const festival = pgTable("festival", {
	festivalName: text("festival_name").notNull(),
	startDate: date("start_date").notNull(),
	endDate: date("end_date").notNull(),
	festivalId: uuid("festival_id").defaultRandom().notNull(),
	festivalSiteId: uuid("festival_site_id").notNull(),
	infoUrl: text("info_url"),
	salesAreOpen: boolean("sales_are_open").default(false).notNull(),
	emailBannerImage: text("email_banner_image"),
	preBadgeIntegration: boolean("pre_badge_integration").default(false).notNull(),
}, (table) => [
	foreignKey({
			columns: [table.festivalSiteId],
			foreignColumns: [festivalSite.festivalSiteId],
			name: "festival_festival_site_id_fkey"
		}),
]);

export const eventSite = pgTable("event_site", {
	eventSiteId: uuid("event_site_id").defaultRandom().notNull(),
	festivalSiteId: uuid("festival_site_id").notNull(),
	location: point(),
	name: text().notNull(),
	description: text(),
	canHostMultipleEvents: boolean("can_host_multiple_events").notNull(),
	theme: text(),
	equipment: text(),
	peopleCap: integer("people_cap"),
	structureType: text("structure_type").notNull(),
	forbiddenForNewEvents: boolean("forbidden_for_new_events").default(false).notNull(),
}, (table) => [
	foreignKey({
			columns: [table.festivalSiteId],
			foreignColumns: [festivalSite.festivalSiteId],
			name: "event_site_festival_site_id_fkey"
		}),
]);

export const eventType = pgTable("event_type", {
	eventTypeId: text("event_type_id").notNull(),
});

export const diet = pgTable("diet", {
	dietId: text("diet_id").notNull(),
	description: text().notNull(),
});

export const discount = pgTable("discount", {
	discountId: uuid("discount_id").defaultRandom().notNull(),
	discountCode: text("discount_code").notNull(),
	purchaseTypeId: text("purchase_type_id").notNull(),
	priceMultiplier: doublePrecision("price_multiplier").notNull(),
}, (table) => [
	foreignKey({
			columns: [table.purchaseTypeId],
			foreignColumns: [purchaseType.purchaseTypeId],
			name: "discount_purchase_type_id_fkey"
		}),
]);

export const inviteCode = pgTable("invite_code", {
	code: uuid().defaultRandom().notNull(),
	createdByAccountId: uuid("created_by_account_id").notNull(),
	usedByAccountId: uuid("used_by_account_id"),
	festivalId: uuid("festival_id"),
}, (table) => [
	foreignKey({
			columns: [table.createdByAccountId],
			foreignColumns: [account.accountId],
			name: "invite_code_created_by_account_id_fkey"
		}),
	foreignKey({
			columns: [table.festivalId],
			foreignColumns: [festival.festivalId],
			name: "invite_code_festival_id_fkey"
		}),
	foreignKey({
			columns: [table.usedByAccountId],
			foreignColumns: [account.accountId],
			name: "invite_code_used_by_account_id_fkey"
		}),
]);

export const faqNode = pgTable("faq_node", {
	faqNodeId: uuid("faq_node_id").defaultRandom().notNull(),
	title: text().notNull(),
	content: text(),
	order: integer(),
	parentFaqNodeId: uuid("parent_faq_node_id"),
}, (table) => [
	foreignKey({
			columns: [table.parentFaqNodeId],
			foreignColumns: [table.faqNodeId],
			name: "faq_node_parent_faq_node_id_fkey"
		}),
]);

export const announcement = pgTable("announcement", {
	announcementId: uuid("announcement_id").defaultRandom().notNull(),
	title: text().notNull(),
	content: text().notNull(),
	announcedAt: timestamp("announced_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
});

export const storedImage = pgTable("stored_image", {
	storedImageId: uuid("stored_image_id").defaultRandom().notNull(),
	ownedByAccountId: uuid("owned_by_account_id"),
	// TODO: failed to parse database type 'bytea'
	imageData: unknown("image_data").notNull(),
}, (table) => [
	foreignKey({
			columns: [table.ownedByAccountId],
			foreignColumns: [account.accountId],
			name: "stored_image_owned_by_account_id_fkey"
		}),
]);

export const badgeInfo = pgTable("badge_info", {
	badgeInfoId: uuid("badge_info_id").defaultRandom().notNull(),
	attendeeId: uuid("attendee_id").notNull(),
	festivalId: uuid("festival_id").notNull(),
	badgeName: text("badge_name").notNull(),
	badgeUsername: text("badge_username"),
	badgeBio: text("badge_bio"),
	badgeLocation: text("badge_location"),
	badgePictureUrl: text("badge_picture_url"),
	badgePictureImageId: uuid("badge_picture_image_id"),
	attendedVc1: boolean("attended_vc_1"),
	attendedVc2: boolean("attended_vc_2"),
}, (table) => [
	index("attendee_id").using("btree", table.attendeeId.asc().nullsLast().op("uuid_ops")),
	index("festival_id").using("btree", table.festivalId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.attendeeId],
			foreignColumns: [attendee.attendeeId],
			name: "badge_info_attendee_id_fkey"
		}),
	foreignKey({
			columns: [table.badgePictureImageId],
			foreignColumns: [storedImage.storedImageId],
			name: "badge_info_badge_picture_image_id_fkey"
		}),
	foreignKey({
			columns: [table.festivalId],
			foreignColumns: [festival.festivalId],
			name: "badge_info_festival_id_fkey"
		}),
]);

export const event = pgTable("event", {
	name: text().notNull(),
	description: text().notNull(),
	startDatetime: timestamp("start_datetime", { mode: 'string' }).notNull(),
	endDatetime: timestamp("end_datetime", { mode: 'string' }),
	plaintextLocation: text("plaintext_location"),
	eventId: uuid("event_id").defaultRandom().notNull(),
	createdByAccountId: uuid("created_by_account_id").notNull(),
	eventSiteLocation: uuid("event_site_location"),
	eventType: text("event_type").default('UNOFFICIAL').notNull(),
	willBeFilmed: boolean("will_be_filmed").default(false).notNull(),
	lastModified: timestamp("last_modified", { withTimezone: true, mode: 'string' }),
	tags: text().array().default(["RAY"]).notNull(),
}, (table) => [
	foreignKey({
			columns: [table.createdByAccountId],
			foreignColumns: [account.accountId],
			name: "event_created_by_account_id_fkey"
		}),
	foreignKey({
			columns: [table.eventSiteLocation],
			foreignColumns: [eventSite.eventSiteId],
			name: "event_event_site_location_fkey"
		}),
	foreignKey({
			columns: [table.eventType],
			foreignColumns: [eventType.eventTypeId],
			name: "event_event_type_fkey"
		}),
]);

export const accountPasswordResetSecret = pgTable("account_password_reset_secret", {
	accountPasswordResetSecretId: uuid("account_password_reset_secret_id").defaultRandom().notNull(),
	accountId: uuid("account_id").notNull(),
	secret: text().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.accountId],
			foreignColumns: [account.accountId],
			name: "account_password_reset_secret_account_id_fkey"
		}),
]);

export const attendee = pgTable("attendee", {
	name: text().notNull(),
	notes: text().default('\'').notNull(),
	discordHandle: text("discord_handle"),
	interestedInPreCall: boolean("interested_in_pre_call").default(false).notNull(),
	planningToCamp: boolean("planning_to_camp").default(false).notNull(),
	twitterHandle: text("twitter_handle"),
	medicalTraining: text("medical_training"),
	interestedInVolunteeringAs: text("interested_in_volunteering_as"),
	diet: text(),
	hasAllergyMilk: boolean("has_allergy_milk"),
	hasAllergyEggs: boolean("has_allergy_eggs"),
	hasAllergyFish: boolean("has_allergy_fish"),
	hasAllergyShellfish: boolean("has_allergy_shellfish"),
	hasAllergyTreeNuts: boolean("has_allergy_tree_nuts"),
	hasAllergyPeanuts: boolean("has_allergy_peanuts"),
	hasAllergyWheat: boolean("has_allergy_wheat"),
	hasAllergySoy: boolean("has_allergy_soy"),
	isPrimaryForAccount: boolean("is_primary_for_account").default(false).notNull(),
	associatedAccountId: uuid("associated_account_id").notNull(),
	attendeeId: uuid("attendee_id").defaultRandom().notNull(),
	age: integer(),
	ageRange: text("age_range"),
	shareTicketStatusWithSelflathing: boolean("share_ticket_status_with_selflathing"),
	phoneNumber: text("phone_number"),
	emailAddress: text("email_address"),
}, (table) => [
	foreignKey({
			columns: [table.ageRange],
			foreignColumns: [ageRange.ageRange],
			name: "attendee_age_range_fkey"
		}),
	foreignKey({
			columns: [table.associatedAccountId],
			foreignColumns: [account.accountId],
			name: "attendee_associated_account_id_fkey"
		}),
	foreignKey({
			columns: [table.interestedInVolunteeringAs],
			foreignColumns: [volunteerType.volunteerTypeId],
			name: "attendee_interested_in_volunteering_fkey"
		}),
	foreignKey({
			columns: [table.diet],
			foreignColumns: [diet.dietId],
			name: "attendee_special_diet_fkey"
		}),
]);

export const purchase = pgTable("purchase", {
	purchasedOn: timestamp("purchased_on", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	purchaseTypeId: text("purchase_type_id").notNull(),
	ownedByAccountId: uuid("owned_by_account_id"),
	purchaseId: uuid("purchase_id").defaultRandom().notNull(),
	stripePaymentIntent: text("stripe_payment_intent"),
	checkedIn: boolean("checked_in"),
	isTestPurchase: boolean("is_test_purchase").default(false).notNull(),
	appliedDiscount: uuid("applied_discount"),
}, (table) => [
	foreignKey({
			columns: [table.appliedDiscount],
			foreignColumns: [discount.discountId],
			name: "purchase_applied_discount_fkey"
		}),
	foreignKey({
			columns: [table.ownedByAccountId],
			foreignColumns: [account.accountId],
			name: "purchase_owned_by_account_id_fkey"
		}),
	foreignKey({
			columns: [table.purchaseTypeId],
			foreignColumns: [purchaseType.purchaseTypeId],
			name: "purchase_purchase_type_id_fkey"
		}),
]);

export const attendeeCabin = pgTable("attendee_cabin", {
	attendeeId: uuid("attendee_id").notNull(),
	cabinId: uuid("cabin_id").notNull(),
	festivalId: uuid("festival_id").notNull(),
}, (table) => [
	foreignKey({
			columns: [table.attendeeId],
			foreignColumns: [attendee.attendeeId],
			name: "attendee_cabin_attendee_id_fkey"
		}),
	foreignKey({
			columns: [table.cabinId],
			foreignColumns: [cabin.cabinId],
			name: "attendee_cabin_cabin_id_fkey"
		}),
	foreignKey({
			columns: [table.festivalId],
			foreignColumns: [festival.festivalId],
			name: "attendee_cabin_festival_id_fkey"
		}),
]);

export const cabin = pgTable("cabin", {
	cabinId: uuid("cabin_id").defaultRandom().notNull(),
	name: text().notNull(),
	maxOccupancy: integer("max_occupancy"),
	nickname: text(),
	festivalSiteId: uuid("festival_site_id").notNull(),
	notes: text(),
}, (table) => [
	index("fki_cabin_festival_site_id").using("btree", table.festivalSiteId.asc().nullsLast().op("uuid_ops")),
	index("fki_cabin_festival_site_id_fkey").using("btree", table.festivalSiteId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.festivalSiteId],
			foreignColumns: [festivalSite.festivalSiteId],
			name: "cabin_festival_site_id_fkey"
		}),
]);

export const festivalSite = pgTable("festival_site", {
	festivalSiteName: text("festival_site_name").notNull(),
	location: point().notNull(),
	festivalSiteId: uuid("festival_site_id").defaultRandom().notNull(),
});
export const purchaseSorted = pgView("purchase sorted", {	purchasedOn: timestamp("purchased_on", { withTimezone: true, mode: 'string' }),
	purchaseTypeId: text("purchase_type_id"),
	ownedByAccountId: uuid("owned_by_account_id"),
	purchaseId: uuid("purchase_id"),
	stripePaymentIntent: text("stripe_payment_intent"),
	checkedIn: boolean("checked_in"),
	isTestPurchase: boolean("is_test_purchase"),
	appliedDiscount: uuid("applied_discount"),
}).as(sql`SELECT purchase.purchased_on, purchase.purchase_type_id, purchase.owned_by_account_id, purchase.purchase_id, purchase.stripe_payment_intent, purchase.checked_in, purchase.is_test_purchase, purchase.applied_discount FROM purchase ORDER BY purchase.purchased_on DESC`);