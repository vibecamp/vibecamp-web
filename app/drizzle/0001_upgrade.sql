-- ALLOW-DESTRUCTIVE: drops account.is_seed_account, is_authorized_to_buy_tickets, application_id, is_low_income, is_team_member and the invite-code referral function; ticket sales are no longer gated by application or invitation, and per-account role flags are deferred to a later RBAC change
ALTER TABLE account_password_reset_secret
    ADD COLUMN created_at timestamptz NOT NULL DEFAULT now(),
    ADD COLUMN used_at timestamptz;
--> statement-breakpoint
CREATE INDEX account_password_reset_secret_secret_idx ON account_password_reset_secret (secret);
--> statement-breakpoint
ALTER TABLE purchase_type
    ADD COLUMN sale_enabled boolean NOT NULL DEFAULT false,
    ADD COLUMN details text,
    ADD COLUMN additional_info text,
    ADD COLUMN max_per_ticket integer DEFAULT 1,
    ADD CONSTRAINT product_addon_cap CHECK (max_per_ticket IS NULL OR max_per_ticket > 0);
--> statement-breakpoint
UPDATE festival SET sales_are_open = false WHERE sales_are_open;
--> statement-breakpoint
CREATE UNIQUE INDEX one_selling_festival ON festival ((true)) WHERE sales_are_open;
--> statement-breakpoint
CREATE TABLE purchase_type_addon (
    ticket_type_id text NOT NULL REFERENCES purchase_type,
    addon_type_id text NOT NULL REFERENCES purchase_type,
    PRIMARY KEY (ticket_type_id, addon_type_id)
);
--> statement-breakpoint
CREATE TABLE purchase_type_addon_exclusion (
    addon_a text NOT NULL REFERENCES purchase_type,
    addon_b text NOT NULL REFERENCES purchase_type,
    PRIMARY KEY (addon_a, addon_b),
    CHECK (addon_a < addon_b)
);
--> statement-breakpoint
CREATE FUNCTION validate_addon_rule() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE a purchase_type; b purchase_type;
BEGIN
    IF TG_TABLE_NAME = 'purchase_type_addon' THEN
        SELECT * INTO a FROM purchase_type WHERE purchase_type_id = NEW.ticket_type_id;
        SELECT * INTO b FROM purchase_type WHERE purchase_type_id = NEW.addon_type_id;
        IF NOT a.is_attendance_ticket OR b.is_attendance_ticket OR a.festival_id <> b.festival_id THEN
            RAISE EXCEPTION 'Invalid ticket/addon relationship';
        END IF;
    ELSE
        SELECT * INTO a FROM purchase_type WHERE purchase_type_id = NEW.addon_a;
        SELECT * INTO b FROM purchase_type WHERE purchase_type_id = NEW.addon_b;
        IF a.is_attendance_ticket OR b.is_attendance_ticket OR a.festival_id <> b.festival_id THEN
            RAISE EXCEPTION 'Invalid addon exclusion';
        END IF;
    END IF;
    RETURN NEW;
END $$;
--> statement-breakpoint
CREATE TRIGGER valid_addon BEFORE INSERT OR UPDATE ON purchase_type_addon FOR EACH ROW EXECUTE FUNCTION validate_addon_rule();
--> statement-breakpoint
CREATE TRIGGER valid_exclusion BEFORE INSERT OR UPDATE ON purchase_type_addon_exclusion FOR EACH ROW EXECUTE FUNCTION validate_addon_rule();
--> statement-breakpoint
CREATE TABLE discount_code (
    discount_code_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    festival_id uuid NOT NULL REFERENCES festival,
    code text NOT NULL,
    enabled boolean NOT NULL DEFAULT true,
    starts_at timestamptz,
    ends_at timestamptz,
    max_uses integer CHECK (max_uses IS NULL OR max_uses > 0),
    percent_bps integer,
    fixed_cents integer,
    UNIQUE (festival_id, code),
    CHECK (code = upper(btrim(code)) AND length(code) > 0),
    CHECK ((percent_bps BETWEEN 1 AND 10000 AND fixed_cents IS NULL) OR (percent_bps IS NULL AND fixed_cents > 0)),
    CHECK (percent_bps IS NOT NULL OR fixed_cents IS NOT NULL),
    CHECK (starts_at IS NULL OR ends_at IS NULL OR starts_at < ends_at)
);
--> statement-breakpoint
CREATE TABLE discount_code_ticket_type (
    discount_code_id uuid NOT NULL REFERENCES discount_code,
    purchase_type_id text NOT NULL REFERENCES purchase_type,
    PRIMARY KEY (discount_code_id, purchase_type_id)
);
--> statement-breakpoint
CREATE TABLE discount_code_addon_type (
    discount_code_id uuid NOT NULL REFERENCES discount_code,
    purchase_type_id text NOT NULL REFERENCES purchase_type,
    PRIMARY KEY (discount_code_id, purchase_type_id)
);
--> statement-breakpoint
CREATE TABLE checkout_order (
    checkout_order_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    account_id uuid NOT NULL REFERENCES account,
    festival_id uuid NOT NULL REFERENCES festival,
    target_ticket_id uuid REFERENCES purchase,
    request_id uuid NOT NULL,
    cart jsonb NOT NULL,
    quote jsonb NOT NULL,
    stripe_params jsonb NOT NULL,
    status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'fulfilled', 'closed')),
    needs_attention boolean NOT NULL DEFAULT false,
    stripe_session_id text UNIQUE,
    stripe_url text,
    payment_intent text UNIQUE,
    stripe_event_id text,
    discount_code_id uuid REFERENCES discount_code,
    discounted_ticket_count integer NOT NULL DEFAULT 0 CHECK (discounted_ticket_count >= 0),
    created_at timestamptz NOT NULL DEFAULT now(),
    fulfilled_at timestamptz,
    UNIQUE (account_id, request_id)
);
--> statement-breakpoint
CREATE UNIQUE INDEX one_pending_addon_order ON checkout_order (target_ticket_id) WHERE status = 'pending';
--> statement-breakpoint
ALTER TABLE purchase
    ADD COLUMN parent_purchase_id uuid REFERENCES purchase,
    ADD COLUMN checkout_order_id uuid REFERENCES checkout_order,
    ADD COLUMN gross_price_cents integer CHECK (gross_price_cents >= 0),
    ADD COLUMN discount_cents integer CHECK (discount_cents >= 0 AND discount_cents <= gross_price_cents),
    ADD COLUMN product_name_snapshot text,
    ADD COLUMN details_snapshot text,
    ADD COLUMN additional_info_snapshot text;
--> statement-breakpoint
CREATE INDEX purchase_parent ON purchase (parent_purchase_id);
--> statement-breakpoint
CREATE TABLE ticket_badge (
    ticket_id uuid PRIMARY KEY REFERENCES purchase,
    badge_name text NOT NULL CHECK (length(btrim(badge_name)) BETWEEN 1 AND 20),
    badge_username text CHECK (length(badge_username) <= 20 AND badge_username NOT LIKE '@%'),
    badge_location text CHECK (length(badge_location) <= 20),
    badge_bio text CHECK (length(badge_bio) <= 160),
    badge_picture_url text,
    badge_picture_image_id uuid REFERENCES stored_image
);
--> statement-breakpoint
DROP FUNCTION account_referral_chain(uuid);
--> statement-breakpoint
ALTER TABLE account
    DROP COLUMN is_seed_account,
    DROP COLUMN is_authorized_to_buy_tickets,
    DROP COLUMN application_id,
    DROP COLUMN is_low_income,
    DROP COLUMN is_team_member;
