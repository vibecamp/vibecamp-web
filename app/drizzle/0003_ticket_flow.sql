-- ALLOW-DESTRUCTIVE: drops purchase_type.max_per_account (per-account limits are removed) and festival.sales_are_open (sales are open while a ticket is in its sale window), and turns sale-window dates into timestamps at midnight UTC
ALTER TABLE purchase ADD COLUMN secret_index integer;
--> statement-breakpoint
ALTER TABLE purchase_type ADD COLUMN cap_group text;
--> statement-breakpoint
ALTER TABLE purchase_type DROP COLUMN max_per_account;
--> statement-breakpoint
ALTER TABLE purchase_type ALTER COLUMN available_from TYPE timestamptz USING available_from::timestamp AT TIME ZONE 'UTC';
--> statement-breakpoint
ALTER TABLE purchase_type ALTER COLUMN available_to TYPE timestamptz USING available_to::timestamp AT TIME ZONE 'UTC';
--> statement-breakpoint
DROP INDEX one_selling_festival;
--> statement-breakpoint
ALTER TABLE festival DROP COLUMN sales_are_open;
