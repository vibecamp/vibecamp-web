-- ALLOW-DESTRUCTIVE: event_site becomes the global location table (Camp Champions rows soft-deleted, equipment folded into description, festival_site_id/structure_type/equipment/theme/point dropped after export, GPS kept as latitude/longitude) and event free-text locations move to legacy_event_location
ALTER TABLE event_site
    ADD COLUMN pin_x double precision,
    ADD COLUMN pin_y double precision,
    ADD COLUMN latitude double precision,
    ADD COLUMN longitude double precision,
    ADD COLUMN deleted_at timestamptz;
--> statement-breakpoint
UPDATE event_site SET latitude = location[0], longitude = location[1] WHERE location IS NOT NULL;
--> statement-breakpoint
UPDATE event_site
SET description = concat_ws(E'\n\n', nullif(btrim(description), ''), btrim(equipment))
WHERE nullif(btrim(equipment), '') IS NOT NULL;
--> statement-breakpoint
UPDATE event_site SET deleted_at = now()
WHERE festival_site_id IN (SELECT festival_site_id FROM festival_site WHERE festival_site_name = 'Camp Champions');
--> statement-breakpoint
UPDATE event_site SET forbidden_for_new_events = NOT forbidden_for_new_events;
--> statement-breakpoint
ALTER TABLE event_site
    DROP COLUMN festival_site_id,
    DROP COLUMN structure_type,
    DROP COLUMN equipment,
    DROP COLUMN theme,
    DROP COLUMN location;
--> statement-breakpoint
ALTER TABLE event_site RENAME TO location;
--> statement-breakpoint
ALTER TABLE location RENAME CONSTRAINT event_site_pkey TO location_pkey;
--> statement-breakpoint
ALTER TABLE location RENAME COLUMN event_site_id TO location_id;
--> statement-breakpoint
ALTER TABLE location RENAME COLUMN people_cap TO capacity;
--> statement-breakpoint
ALTER TABLE location RENAME COLUMN is_av_site TO has_av;
--> statement-breakpoint
ALTER TABLE location RENAME COLUMN forbidden_for_new_events TO events_allowed;
--> statement-breakpoint
ALTER TABLE location ALTER COLUMN events_allowed SET DEFAULT true;
--> statement-breakpoint
CREATE TABLE location_category (
    location_category_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL UNIQUE CHECK (btrim(name) <> ''),
    color text NOT NULL CHECK (color ~ '^#[0-9a-f]{6}$'),
    sort_order integer NOT NULL,
    CONSTRAINT location_category_sort_order_key UNIQUE (sort_order) DEFERRABLE INITIALLY DEFERRED
);
--> statement-breakpoint
ALTER TABLE location
    ADD COLUMN location_category_id uuid REFERENCES location_category,
    ADD COLUMN aka text,
    ADD CONSTRAINT location_aka_check CHECK (aka IS NULL OR btrim(aka) <> ''),
    ADD CONSTRAINT location_pin_check CHECK ((pin_x IS NULL) = (pin_y IS NULL) AND pin_x BETWEEN 0 AND 1 AND pin_y BETWEEN 0 AND 1),
    ADD CONSTRAINT location_gps_check CHECK ((latitude IS NULL) = (longitude IS NULL) AND latitude BETWEEN -90 AND 90 AND longitude BETWEEN -180 AND 180);
--> statement-breakpoint
CREATE UNIQUE INDEX location_name_key ON location (name) WHERE deleted_at IS NULL;
--> statement-breakpoint
INSERT INTO location (name, can_host_multiple_events) VALUES ('Roaming', true), ('Offsite', true), ('Other', true);
--> statement-breakpoint
CREATE TABLE image (
    image_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    content_type text NOT NULL CHECK (content_type IN ('image/png', 'image/jpeg', 'image/webp')),
    width integer NOT NULL CHECK (width > 0),
    height integer NOT NULL CHECK (height > 0),
    data bytea NOT NULL,
    created_at timestamptz NOT NULL DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE location_image (
    location_id uuid NOT NULL REFERENCES location,
    image_id uuid NOT NULL REFERENCES image,
    sort_order integer NOT NULL,
    PRIMARY KEY (location_id, image_id),
    CONSTRAINT location_image_sort_order_key UNIQUE (location_id, sort_order) DEFERRABLE INITIALLY DEFERRED
);
--> statement-breakpoint
CREATE TABLE map (
    map_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    image_id uuid NOT NULL REFERENCES image,
    created_at timestamptz NOT NULL DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE legacy_event_location (
    event_id uuid PRIMARY KEY REFERENCES event ON DELETE CASCADE,
    location_text text NOT NULL
);
--> statement-breakpoint
INSERT INTO legacy_event_location (event_id, location_text)
SELECT event_id, plaintext_location FROM event WHERE nullif(btrim(plaintext_location), '') IS NOT NULL;
--> statement-breakpoint
ALTER TABLE event RENAME COLUMN event_site_location TO location_id;
--> statement-breakpoint
ALTER TABLE event RENAME CONSTRAINT event_event_site_location_fkey TO event_location_id_fkey;
--> statement-breakpoint
UPDATE event SET location_id = (SELECT location_id FROM location WHERE name = 'Other' AND deleted_at IS NULL)
WHERE location_id IS NULL;
--> statement-breakpoint
ALTER TABLE event ALTER COLUMN location_id SET NOT NULL;
--> statement-breakpoint
ALTER TABLE event DROP COLUMN plaintext_location;
