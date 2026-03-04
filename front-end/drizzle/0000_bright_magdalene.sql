-- Current sql file was generated after introspecting the database
-- If you want to run this migration please uncomment this code before executing migrations
/*
CREATE TABLE "volunteer_type" (
	"volunteer_type_id" text NOT NULL,
	"description" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "event_bookmark" (
	"account_id" uuid NOT NULL,
	"event_id" uuid NOT NULL
);
--> statement-breakpoint
CREATE TABLE "account" (
	"email_address" text NOT NULL,
	"password_hash" text,
	"password_salt" text,
	"notes" text DEFAULT '''''' NOT NULL,
	"is_seed_account" boolean DEFAULT false NOT NULL,
	"account_id" uuid DEFAULT gen_random_uuid() NOT NULL,
	"is_authorized_to_buy_tickets" boolean,
	"application_id" uuid,
	"is_team_member" boolean DEFAULT false NOT NULL,
	"is_low_income" boolean DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE TABLE "age_range" (
	"age_range" text NOT NULL,
	"description" text NOT NULL,
	"start" integer,
	"end" integer
);
--> statement-breakpoint
CREATE TABLE "application" (
	"application_id" uuid DEFAULT gen_random_uuid() NOT NULL,
	"is_accepted" boolean,
	"submitted_on" timestamp with time zone DEFAULT now() NOT NULL,
	"name" text NOT NULL,
	"twitter_handle" text,
	"hoping_to_get_out_of_the_festival" text NOT NULL,
	"experiences_hoping_to_share" text NOT NULL,
	"identify_as" text NOT NULL,
	"looking_forward_to_conversations" text NOT NULL,
	"last_conversation" text NOT NULL,
	"strongest_virtues" text NOT NULL,
	"attractive_virtues" text NOT NULL,
	"group_activity" text NOT NULL,
	"interested_in_volunteering" boolean,
	"how_found_out" text NOT NULL,
	"previous_events" text NOT NULL,
	"anything_else" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "purchase_type" (
	"purchase_type_id" text NOT NULL,
	"price_in_cents" integer NOT NULL,
	"max_available" integer,
	"description" text NOT NULL,
	"max_per_account" integer,
	"festival_id" uuid NOT NULL,
	"is_attendance_ticket" boolean DEFAULT false NOT NULL,
	"available_from" date,
	"available_to" date,
	"hidden_from_ui" boolean DEFAULT false NOT NULL,
	"low_income_only" boolean DEFAULT false NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "festival" (
	"festival_name" text NOT NULL,
	"start_date" date NOT NULL,
	"end_date" date NOT NULL,
	"festival_id" uuid DEFAULT gen_random_uuid() NOT NULL,
	"festival_site_id" uuid NOT NULL,
	"info_url" text,
	"sales_are_open" boolean DEFAULT false NOT NULL,
	"email_banner_image" text,
	"pre_badge_integration" boolean DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE TABLE "event_site" (
	"event_site_id" uuid DEFAULT gen_random_uuid() NOT NULL,
	"festival_site_id" uuid NOT NULL,
	"location" "point",
	"name" text NOT NULL,
	"description" text,
	"can_host_multiple_events" boolean NOT NULL,
	"theme" text,
	"equipment" text,
	"people_cap" integer,
	"structure_type" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "event_type" (
	"event_type_id" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "diet" (
	"diet_id" text NOT NULL,
	"description" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "discount" (
	"discount_id" uuid DEFAULT gen_random_uuid() NOT NULL,
	"discount_code" text NOT NULL,
	"purchase_type_id" text NOT NULL,
	"price_multiplier" double precision NOT NULL
);
--> statement-breakpoint
CREATE TABLE "invite_code" (
	"code" uuid DEFAULT gen_random_uuid() NOT NULL,
	"created_by_account_id" uuid NOT NULL,
	"used_by_account_id" uuid,
	"festival_id" uuid
);
--> statement-breakpoint
CREATE TABLE "faq_node" (
	"faq_node_id" uuid DEFAULT gen_random_uuid() NOT NULL,
	"title" text NOT NULL,
	"content" text,
	"order" integer,
	"parent_faq_node_id" uuid
);
--> statement-breakpoint
CREATE TABLE "announcement" (
	"announcement_id" uuid DEFAULT gen_random_uuid() NOT NULL,
	"title" text NOT NULL,
	"content" text NOT NULL,
	"announced_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "stored_image" (
	"stored_image_id" uuid DEFAULT gen_random_uuid() NOT NULL,
	"owned_by_account_id" uuid,
	"image_data" "bytea" NOT NULL
);
--> statement-breakpoint
CREATE TABLE "badge_info" (
	"badge_info_id" uuid DEFAULT gen_random_uuid() NOT NULL,
	"attendee_id" uuid NOT NULL,
	"festival_id" uuid NOT NULL,
	"badge_name" text NOT NULL,
	"badge_username" text,
	"badge_bio" text,
	"badge_location" text,
	"badge_picture_url" text,
	"badge_picture_image_id" uuid,
	"attended_vc_1" boolean,
	"attended_vc_2" boolean
);
--> statement-breakpoint
CREATE TABLE "event" (
	"name" text NOT NULL,
	"description" text NOT NULL,
	"start_datetime" timestamp NOT NULL,
	"end_datetime" timestamp,
	"plaintext_location" text,
	"event_id" uuid DEFAULT gen_random_uuid() NOT NULL,
	"created_by_account_id" uuid NOT NULL,
	"event_site_location" uuid,
	"event_type" text DEFAULT 'UNOFFICIAL' NOT NULL,
	"will_be_filmed" boolean DEFAULT false NOT NULL,
	"last_modified" timestamp with time zone,
	"tags" text[] DEFAULT '{"RAY"}' NOT NULL
);
--> statement-breakpoint
CREATE TABLE "account_password_reset_secret" (
	"account_password_reset_secret_id" uuid DEFAULT gen_random_uuid() NOT NULL,
	"account_id" uuid NOT NULL,
	"secret" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "attendee" (
	"name" text NOT NULL,
	"notes" text DEFAULT '''''' NOT NULL,
	"discord_handle" text,
	"interested_in_pre_call" boolean DEFAULT false NOT NULL,
	"planning_to_camp" boolean DEFAULT false NOT NULL,
	"twitter_handle" text,
	"medical_training" text,
	"interested_in_volunteering_as" text,
	"diet" text,
	"has_allergy_milk" boolean,
	"has_allergy_eggs" boolean,
	"has_allergy_fish" boolean,
	"has_allergy_shellfish" boolean,
	"has_allergy_tree_nuts" boolean,
	"has_allergy_peanuts" boolean,
	"has_allergy_wheat" boolean,
	"has_allergy_soy" boolean,
	"is_primary_for_account" boolean DEFAULT false NOT NULL,
	"associated_account_id" uuid NOT NULL,
	"attendee_id" uuid DEFAULT gen_random_uuid() NOT NULL,
	"age" integer,
	"age_range" text,
	"share_ticket_status_with_selflathing" boolean,
	"phone_number" text,
	"email_address" text
);
--> statement-breakpoint
CREATE TABLE "purchase" (
	"purchased_on" timestamp with time zone DEFAULT now() NOT NULL,
	"purchase_type_id" text NOT NULL,
	"owned_by_account_id" uuid,
	"purchase_id" uuid DEFAULT gen_random_uuid() NOT NULL,
	"stripe_payment_intent" text,
	"checked_in" boolean,
	"is_test_purchase" boolean DEFAULT false NOT NULL,
	"applied_discount" uuid
);
--> statement-breakpoint
CREATE TABLE "attendee_cabin" (
	"attendee_id" uuid NOT NULL,
	"cabin_id" uuid NOT NULL,
	"festival_id" uuid NOT NULL
);
--> statement-breakpoint
CREATE TABLE "cabin" (
	"cabin_id" uuid DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"max_occupancy" integer,
	"nickname" text,
	"festival_site_id" uuid NOT NULL,
	"notes" text
);
--> statement-breakpoint
CREATE TABLE "festival_site" (
	"festival_site_name" text NOT NULL,
	"location" "point" NOT NULL,
	"festival_site_id" uuid DEFAULT gen_random_uuid() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "event_bookmark" ADD CONSTRAINT "event_bookmark_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "public"."account"("account_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "event_bookmark" ADD CONSTRAINT "event_bookmark_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "public"."event"("event_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "account" ADD CONSTRAINT "account_application_id_fkey" FOREIGN KEY ("application_id") REFERENCES "public"."application"("application_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "purchase_type" ADD CONSTRAINT "purchase_type_festival_id_fkey" FOREIGN KEY ("festival_id") REFERENCES "public"."festival"("festival_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "festival" ADD CONSTRAINT "festival_festival_site_id_fkey" FOREIGN KEY ("festival_site_id") REFERENCES "public"."festival_site"("festival_site_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "event_site" ADD CONSTRAINT "event_site_festival_site_id_fkey" FOREIGN KEY ("festival_site_id") REFERENCES "public"."festival_site"("festival_site_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "discount" ADD CONSTRAINT "discount_purchase_type_id_fkey" FOREIGN KEY ("purchase_type_id") REFERENCES "public"."purchase_type"("purchase_type_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invite_code" ADD CONSTRAINT "invite_code_created_by_account_id_fkey" FOREIGN KEY ("created_by_account_id") REFERENCES "public"."account"("account_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invite_code" ADD CONSTRAINT "invite_code_festival_id_fkey" FOREIGN KEY ("festival_id") REFERENCES "public"."festival"("festival_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invite_code" ADD CONSTRAINT "invite_code_used_by_account_id_fkey" FOREIGN KEY ("used_by_account_id") REFERENCES "public"."account"("account_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "faq_node" ADD CONSTRAINT "faq_node_parent_faq_node_id_fkey" FOREIGN KEY ("parent_faq_node_id") REFERENCES "public"."faq_node"("faq_node_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stored_image" ADD CONSTRAINT "stored_image_owned_by_account_id_fkey" FOREIGN KEY ("owned_by_account_id") REFERENCES "public"."account"("account_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "badge_info" ADD CONSTRAINT "badge_info_attendee_id_fkey" FOREIGN KEY ("attendee_id") REFERENCES "public"."attendee"("attendee_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "badge_info" ADD CONSTRAINT "badge_info_badge_picture_image_id_fkey" FOREIGN KEY ("badge_picture_image_id") REFERENCES "public"."stored_image"("stored_image_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "badge_info" ADD CONSTRAINT "badge_info_festival_id_fkey" FOREIGN KEY ("festival_id") REFERENCES "public"."festival"("festival_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "event" ADD CONSTRAINT "event_created_by_account_id_fkey" FOREIGN KEY ("created_by_account_id") REFERENCES "public"."account"("account_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "event" ADD CONSTRAINT "event_event_site_location_fkey" FOREIGN KEY ("event_site_location") REFERENCES "public"."event_site"("event_site_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "event" ADD CONSTRAINT "event_event_type_fkey" FOREIGN KEY ("event_type") REFERENCES "public"."event_type"("event_type_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "account_password_reset_secret" ADD CONSTRAINT "account_password_reset_secret_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "public"."account"("account_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "attendee" ADD CONSTRAINT "attendee_age_range_fkey" FOREIGN KEY ("age_range") REFERENCES "public"."age_range"("age_range") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "attendee" ADD CONSTRAINT "attendee_associated_account_id_fkey" FOREIGN KEY ("associated_account_id") REFERENCES "public"."account"("account_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "attendee" ADD CONSTRAINT "attendee_interested_in_volunteering_fkey" FOREIGN KEY ("interested_in_volunteering_as") REFERENCES "public"."volunteer_type"("volunteer_type_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "attendee" ADD CONSTRAINT "attendee_special_diet_fkey" FOREIGN KEY ("diet") REFERENCES "public"."diet"("diet_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "purchase" ADD CONSTRAINT "purchase_applied_discount_fkey" FOREIGN KEY ("applied_discount") REFERENCES "public"."discount"("discount_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "purchase" ADD CONSTRAINT "purchase_owned_by_account_id_fkey" FOREIGN KEY ("owned_by_account_id") REFERENCES "public"."account"("account_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "purchase" ADD CONSTRAINT "purchase_purchase_type_id_fkey" FOREIGN KEY ("purchase_type_id") REFERENCES "public"."purchase_type"("purchase_type_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "attendee_cabin" ADD CONSTRAINT "attendee_cabin_attendee_id_fkey" FOREIGN KEY ("attendee_id") REFERENCES "public"."attendee"("attendee_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "attendee_cabin" ADD CONSTRAINT "attendee_cabin_cabin_id_fkey" FOREIGN KEY ("cabin_id") REFERENCES "public"."cabin"("cabin_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "attendee_cabin" ADD CONSTRAINT "attendee_cabin_festival_id_fkey" FOREIGN KEY ("festival_id") REFERENCES "public"."festival"("festival_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cabin" ADD CONSTRAINT "cabin_festival_site_id_fkey" FOREIGN KEY ("festival_site_id") REFERENCES "public"."festival_site"("festival_site_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "event_bookmark_account_id_idx" ON "event_bookmark" USING btree ("account_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "event_bookmark_event_id_idx" ON "event_bookmark" USING btree ("event_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "attendee_id" ON "badge_info" USING btree ("attendee_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "festival_id" ON "badge_info" USING btree ("festival_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "fki_cabin_festival_site_id" ON "cabin" USING btree ("festival_site_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "fki_cabin_festival_site_id_fkey" ON "cabin" USING btree ("festival_site_id" uuid_ops);--> statement-breakpoint
CREATE VIEW "public"."purchase sorted" AS (SELECT purchase.purchased_on, purchase.purchase_type_id, purchase.owned_by_account_id, purchase.purchase_id, purchase.stripe_payment_intent, purchase.checked_in, purchase.is_test_purchase, purchase.applied_discount FROM purchase ORDER BY purchase.purchased_on DESC);
*/