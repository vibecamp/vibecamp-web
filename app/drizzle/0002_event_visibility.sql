ALTER TABLE event ADD COLUMN public boolean NOT NULL DEFAULT false;
--> statement-breakpoint
ALTER TABLE event ALTER COLUMN public SET DEFAULT true;
