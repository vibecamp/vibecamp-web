SET check_function_bodies = false;
--> statement-breakpoint

--
-- Name: referral_chain_result; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.referral_chain_result AS (
	account_id integer,
	is_seed_account boolean,
	referred_by integer
);
--> statement-breakpoint


--
-- Name: account_referral_chain(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.account_referral_chain(account_id uuid) RETURNS TABLE(account_id uuid, is_seed_account boolean, referred_by uuid)
    LANGUAGE sql STRICT
    AS $_$
WITH RECURSIVE referrals AS (
    SELECT account_id, is_seed_account, created_by_account_id as referred_by FROM account LEFT JOIN invite_code ON account.account_id = invite_code.used_by_account_id
), referral_chain AS (
    SELECT *
    FROM referrals
    WHERE referrals.account_id = $1
UNION
    SELECT referrals.account_id, referrals.is_seed_account, referrals.referred_by
    FROM referrals, referral_chain
    WHERE referrals.account_id = referral_chain.referred_by
)
SELECT * FROM referral_chain
$_$;
--> statement-breakpoint


SET default_tablespace = '';
--> statement-breakpoint

SET default_table_access_method = heap;
--> statement-breakpoint

--
-- Name: account; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.account (
    email_address text NOT NULL,
    password_hash text,
    password_salt text,
    notes text DEFAULT ''''''::text NOT NULL,
    is_seed_account boolean DEFAULT false NOT NULL,
    account_id uuid DEFAULT gen_random_uuid() NOT NULL,
    is_authorized_to_buy_tickets boolean,
    application_id uuid,
    is_team_member boolean DEFAULT false NOT NULL,
    is_low_income boolean DEFAULT false NOT NULL
);
--> statement-breakpoint


--
-- Name: TABLE account; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.account IS 'Represents one user of the app, with one set of login credentials.';
--> statement-breakpoint


--
-- Name: COLUMN account.notes; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.account.notes IS 'Free-text field, for use by team members as they provide support to attendees';
--> statement-breakpoint


--
-- Name: COLUMN account.is_seed_account; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.account.is_seed_account IS 'If true, this account can purchase tickets and create invite codes without having an invite code themselves';
--> statement-breakpoint


--
-- Name: COLUMN account.is_authorized_to_buy_tickets; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.account.is_authorized_to_buy_tickets IS 'Accounts may be authorized to buy tickets via other means (being a seed account, having used an invite code), but this flag overrides those and just gives the account permission to buy tickets (but no invite codes)';
--> statement-breakpoint


--
-- Name: account_password_reset_secret; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.account_password_reset_secret (
    account_password_reset_secret_id uuid DEFAULT gen_random_uuid() CONSTRAINT account_password_reset_secr_account_password_reset_sec_not_null NOT NULL,
    account_id uuid NOT NULL,
    secret text NOT NULL
);
--> statement-breakpoint


--
-- Name: age_range; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.age_range (
    age_range text NOT NULL,
    description text NOT NULL,
    start integer,
    "end" integer
);
--> statement-breakpoint


--
-- Name: announcement; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.announcement (
    announcement_id uuid DEFAULT gen_random_uuid() NOT NULL,
    title text NOT NULL,
    content text NOT NULL,
    announced_at timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint


--
-- Name: application; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.application (
    application_id uuid DEFAULT gen_random_uuid() NOT NULL,
    is_accepted boolean,
    submitted_on timestamp with time zone DEFAULT now() NOT NULL,
    name text NOT NULL,
    twitter_handle text,
    hoping_to_get_out_of_the_festival text NOT NULL,
    experiences_hoping_to_share text NOT NULL,
    identify_as text NOT NULL,
    looking_forward_to_conversations text NOT NULL,
    last_conversation text NOT NULL,
    strongest_virtues text NOT NULL,
    attractive_virtues text NOT NULL,
    group_activity text NOT NULL,
    interested_in_volunteering boolean,
    how_found_out text NOT NULL,
    previous_events text NOT NULL,
    anything_else text NOT NULL
);
--> statement-breakpoint


--
-- Name: COLUMN application.is_accepted; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.application.is_accepted IS 'When an application has been reviewed by the team, this should be set to either true (accepted) or false (rejected)';
--> statement-breakpoint


--
-- Name: COLUMN application.hoping_to_get_out_of_the_festival; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.application.hoping_to_get_out_of_the_festival IS 'What are you hoping to get out of vibeclipse?';
--> statement-breakpoint


--
-- Name: COLUMN application.experiences_hoping_to_share; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.application.experiences_hoping_to_share IS 'What experiences are you hoping to share with others at vibeclipse? (We won''t hold you to this!) This can include things like friendmaking/social skills/art workshops, being a good listening/conversation partner, anything eclipse/space/woo related...';
--> statement-breakpoint


--
-- Name: COLUMN application.identify_as; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.application.identify_as IS 'Which do you most closely identify as?';
--> statement-breakpoint


--
-- Name: COLUMN application.looking_forward_to_conversations; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.application.looking_forward_to_conversations IS 'What type of conversations are you looking forward to at vibeclipse?';
--> statement-breakpoint


--
-- Name: COLUMN application.last_conversation; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.application.last_conversation IS 'What was the last conversation you had that you really enjoyed? Why was it so enjoyable for you?';
--> statement-breakpoint


--
-- Name: COLUMN application.strongest_virtues; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.application.strongest_virtues IS 'What would your closest friend say are your two strongest virtues? Choose the two that you think fit best.';
--> statement-breakpoint


--
-- Name: COLUMN application.attractive_virtues; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.application.attractive_virtues IS 'What virtues do you find most attractive in other people?';
--> statement-breakpoint


--
-- Name: COLUMN application.group_activity; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.application.group_activity IS 'What is a group activity you did that you really enjoyed, even if it was many years ago? Who was there? What did you do? What made it so enjoyable? Get descriptive!';
--> statement-breakpoint


--
-- Name: COLUMN application.interested_in_volunteering; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.application.interested_in_volunteering IS 'Are you interested in volunteering at vibeclipse?';
--> statement-breakpoint


--
-- Name: COLUMN application.how_found_out; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.application.how_found_out IS 'How did you find out about this event?';
--> statement-breakpoint


--
-- Name: COLUMN application.previous_events; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.application.previous_events IS 'Have you been to any previous vibecamp events?';
--> statement-breakpoint


--
-- Name: COLUMN application.anything_else; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.application.anything_else IS 'Is there anything else you would like us to know?';
--> statement-breakpoint


--
-- Name: attendee; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.attendee (
    name text NOT NULL,
    notes text DEFAULT ''''''::text NOT NULL,
    discord_handle text,
    interested_in_pre_call boolean DEFAULT false NOT NULL,
    planning_to_camp boolean DEFAULT false NOT NULL,
    twitter_handle text,
    medical_training text,
    interested_in_volunteering_as text,
    diet text,
    has_allergy_milk boolean,
    has_allergy_eggs boolean,
    has_allergy_fish boolean,
    has_allergy_shellfish boolean,
    has_allergy_tree_nuts boolean,
    has_allergy_peanuts boolean,
    has_allergy_wheat boolean,
    has_allergy_soy boolean,
    is_primary_for_account boolean DEFAULT false NOT NULL,
    associated_account_id uuid NOT NULL,
    attendee_id uuid DEFAULT gen_random_uuid() NOT NULL,
    age integer,
    age_range text,
    share_ticket_status_with_selflathing boolean,
    phone_number text,
    email_address text
);
--> statement-breakpoint


--
-- Name: TABLE attendee; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.attendee IS 'Represents one person attending an event. A single account may manage multiple attendees.';
--> statement-breakpoint


--
-- Name: COLUMN attendee.notes; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.attendee.notes IS 'Free-text field, for use by team members as they provide support to attendees';
--> statement-breakpoint


--
-- Name: attendee_cabin; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.attendee_cabin (
    attendee_id uuid NOT NULL,
    cabin_id uuid NOT NULL,
    festival_id uuid NOT NULL
);
--> statement-breakpoint


--
-- Name: badge_info; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.badge_info (
    badge_info_id uuid DEFAULT gen_random_uuid() NOT NULL,
    attendee_id uuid NOT NULL,
    festival_id uuid NOT NULL,
    badge_name text NOT NULL,
    badge_username text,
    badge_bio text,
    badge_location text,
    badge_picture_url text,
    badge_picture_image_id uuid,
    attended_vc_1 boolean,
    attended_vc_2 boolean
);
--> statement-breakpoint


--
-- Name: cabin; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.cabin (
    cabin_id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    max_occupancy integer,
    nickname text,
    festival_site_id uuid NOT NULL,
    notes text
);
--> statement-breakpoint


--
-- Name: diet; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.diet (
    diet_id text NOT NULL,
    description text NOT NULL
);
--> statement-breakpoint


--
-- Name: discount; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.discount (
    discount_id uuid DEFAULT gen_random_uuid() NOT NULL,
    discount_code text NOT NULL,
    purchase_type_id text NOT NULL,
    price_multiplier double precision NOT NULL
);
--> statement-breakpoint


--
-- Name: event; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.event (
    name text NOT NULL,
    description text NOT NULL,
    start_datetime timestamp without time zone NOT NULL,
    end_datetime timestamp without time zone,
    plaintext_location text,
    event_id uuid DEFAULT gen_random_uuid() NOT NULL,
    created_by_account_id uuid NOT NULL,
    event_site_location uuid,
    event_type text DEFAULT 'UNOFFICIAL'::text NOT NULL,
    will_be_filmed boolean DEFAULT false NOT NULL,
    last_modified timestamp with time zone,
    tags text[] DEFAULT ARRAY[]::text[] NOT NULL,
    av_needs text
);
--> statement-breakpoint


--
-- Name: event_bookmark; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.event_bookmark (
    account_id uuid NOT NULL,
    event_id uuid NOT NULL
);
--> statement-breakpoint


--
-- Name: event_site; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.event_site (
    event_site_id uuid DEFAULT gen_random_uuid() NOT NULL,
    festival_site_id uuid NOT NULL,
    location point,
    name text NOT NULL,
    description text,
    can_host_multiple_events boolean NOT NULL,
    theme text,
    equipment text,
    people_cap integer,
    structure_type text NOT NULL,
    forbidden_for_new_events boolean DEFAULT false NOT NULL,
    is_av_site boolean DEFAULT false NOT NULL
);
--> statement-breakpoint


--
-- Name: event_type; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.event_type (
    event_type_id text NOT NULL
);
--> statement-breakpoint


--
-- Name: faq_node; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.faq_node (
    faq_node_id uuid DEFAULT gen_random_uuid() NOT NULL,
    title text NOT NULL,
    content text,
    "order" integer,
    parent_faq_node_id uuid
);
--> statement-breakpoint


--
-- Name: festival; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.festival (
    festival_name text NOT NULL,
    start_date date NOT NULL,
    end_date date NOT NULL,
    festival_id uuid DEFAULT gen_random_uuid() NOT NULL,
    festival_site_id uuid NOT NULL,
    info_url text,
    sales_are_open boolean DEFAULT false NOT NULL,
    email_banner_image text,
    pre_badge_integration boolean DEFAULT false NOT NULL
);
--> statement-breakpoint


--
-- Name: TABLE festival; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.festival IS 'A particular VC event, for example Vibecamp 2024';
--> statement-breakpoint


--
-- Name: COLUMN festival.festival_name; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.festival.festival_name IS 'Descriptive name for the event, eg. "Vibecamp 2024"';
--> statement-breakpoint


--
-- Name: festival_site; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.festival_site (
    festival_site_name text NOT NULL,
    location point NOT NULL,
    festival_site_id uuid DEFAULT gen_random_uuid() NOT NULL
);
--> statement-breakpoint


--
-- Name: TABLE festival_site; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.festival_site IS 'A site/venue where an event may take place, eg. Camp Ramblewood';
--> statement-breakpoint


--
-- Name: COLUMN festival_site.festival_site_name; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.festival_site.festival_site_name IS 'A descriptive name for the event site, eg. "Camp Ramblewood"';
--> statement-breakpoint


--
-- Name: invite_code; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.invite_code (
    code uuid DEFAULT gen_random_uuid() NOT NULL,
    created_by_account_id uuid NOT NULL,
    used_by_account_id uuid,
    festival_id uuid
);
--> statement-breakpoint


--
-- Name: purchase; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.purchase (
    purchased_on timestamp with time zone DEFAULT now() NOT NULL,
    purchase_type_id text NOT NULL,
    owned_by_account_id uuid,
    purchase_id uuid DEFAULT gen_random_uuid() NOT NULL,
    stripe_payment_intent text,
    checked_in boolean,
    is_test_purchase boolean DEFAULT false NOT NULL,
    applied_discount uuid
);
--> statement-breakpoint


--
-- Name: purchase sorted; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public."purchase sorted" AS
 SELECT purchased_on,
    purchase_type_id,
    owned_by_account_id,
    purchase_id,
    stripe_payment_intent,
    checked_in,
    is_test_purchase,
    applied_discount
   FROM public.purchase
  ORDER BY purchased_on DESC;
--> statement-breakpoint


--
-- Name: purchase_type; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.purchase_type (
    purchase_type_id text NOT NULL,
    price_in_cents integer NOT NULL,
    max_available integer,
    description text NOT NULL,
    max_per_account integer,
    festival_id uuid NOT NULL,
    is_attendance_ticket boolean DEFAULT false NOT NULL,
    available_from date,
    available_to date,
    hidden_from_ui boolean DEFAULT false NOT NULL,
    low_income_only boolean DEFAULT false NOT NULL,
    sort_order integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint


--
-- Name: COLUMN purchase_type.sort_order; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.purchase_type.sort_order IS 'Higher numbers will appear later in the purchase selection UI. Ones with the same number will be sorted by their other attributes.';
--> statement-breakpoint


--
-- Name: stored_image; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.stored_image (
    stored_image_id uuid DEFAULT gen_random_uuid() NOT NULL,
    owned_by_account_id uuid,
    image_data bytea NOT NULL
);
--> statement-breakpoint


--
-- Name: volunteer_type; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.volunteer_type (
    volunteer_type_id text NOT NULL,
    description text NOT NULL
);
--> statement-breakpoint


--
-- Name: account account_email_address_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.account
    ADD CONSTRAINT account_email_address_key UNIQUE (email_address);
--> statement-breakpoint


--
-- Name: account_password_reset_secret account_password_reset_secret_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.account_password_reset_secret
    ADD CONSTRAINT account_password_reset_secret_pkey PRIMARY KEY (account_password_reset_secret_id);
--> statement-breakpoint


--
-- Name: account account_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.account
    ADD CONSTRAINT account_pkey PRIMARY KEY (account_id);
--> statement-breakpoint


--
-- Name: age_range age_range_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.age_range
    ADD CONSTRAINT age_range_pkey PRIMARY KEY (age_range);
--> statement-breakpoint


--
-- Name: announcement announcement_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.announcement
    ADD CONSTRAINT announcement_pkey PRIMARY KEY (announcement_id);
--> statement-breakpoint


--
-- Name: application application_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.application
    ADD CONSTRAINT application_pkey PRIMARY KEY (application_id);
--> statement-breakpoint


--
-- Name: attendee attendee_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.attendee
    ADD CONSTRAINT attendee_pkey PRIMARY KEY (attendee_id);
--> statement-breakpoint


--
-- Name: badge_info badge_info_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.badge_info
    ADD CONSTRAINT badge_info_pkey PRIMARY KEY (badge_info_id);
--> statement-breakpoint


--
-- Name: cabin cabin_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cabin
    ADD CONSTRAINT cabin_pkey PRIMARY KEY (cabin_id);
--> statement-breakpoint


--
-- Name: diet diet_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.diet
    ADD CONSTRAINT diet_pkey PRIMARY KEY (diet_id);
--> statement-breakpoint


--
-- Name: discount discount_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.discount
    ADD CONSTRAINT discount_pkey PRIMARY KEY (discount_id);
--> statement-breakpoint


--
-- Name: event event_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.event
    ADD CONSTRAINT event_pkey PRIMARY KEY (event_id);
--> statement-breakpoint


--
-- Name: event_site event_site_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.event_site
    ADD CONSTRAINT event_site_pkey PRIMARY KEY (event_site_id);
--> statement-breakpoint


--
-- Name: event_type event_type_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.event_type
    ADD CONSTRAINT event_type_pkey PRIMARY KEY (event_type_id);
--> statement-breakpoint


--
-- Name: faq_node faq_node_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.faq_node
    ADD CONSTRAINT faq_node_pkey PRIMARY KEY (faq_node_id);
--> statement-breakpoint


--
-- Name: festival festival_festival_name_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.festival
    ADD CONSTRAINT festival_festival_name_key UNIQUE (festival_name);
--> statement-breakpoint


--
-- Name: festival festival_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.festival
    ADD CONSTRAINT festival_pkey PRIMARY KEY (festival_id);
--> statement-breakpoint


--
-- Name: festival_site festival_site_festival_site_name_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.festival_site
    ADD CONSTRAINT festival_site_festival_site_name_key UNIQUE (festival_site_name);
--> statement-breakpoint


--
-- Name: festival_site festival_site_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.festival_site
    ADD CONSTRAINT festival_site_pkey PRIMARY KEY (festival_site_id);
--> statement-breakpoint


--
-- Name: invite_code invite_code_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.invite_code
    ADD CONSTRAINT invite_code_pkey PRIMARY KEY (code);
--> statement-breakpoint


--
-- Name: purchase purchase_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.purchase
    ADD CONSTRAINT purchase_pkey PRIMARY KEY (purchase_id);
--> statement-breakpoint


--
-- Name: purchase_type purchase_type_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.purchase_type
    ADD CONSTRAINT purchase_type_pkey PRIMARY KEY (purchase_type_id);
--> statement-breakpoint


--
-- Name: stored_image stored_image_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.stored_image
    ADD CONSTRAINT stored_image_pkey PRIMARY KEY (stored_image_id);
--> statement-breakpoint


--
-- Name: attendee_cabin unique_attendee_festival; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.attendee_cabin
    ADD CONSTRAINT unique_attendee_festival UNIQUE (attendee_id, festival_id);
--> statement-breakpoint


--
-- Name: volunteer_type volunteer_type_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.volunteer_type
    ADD CONSTRAINT volunteer_type_pkey PRIMARY KEY (volunteer_type_id);
--> statement-breakpoint


--
-- Name: attendee_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX attendee_id ON public.badge_info USING btree (attendee_id);
--> statement-breakpoint


--
-- Name: event_bookmark_account_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX event_bookmark_account_id_idx ON public.event_bookmark USING btree (account_id);
--> statement-breakpoint


--
-- Name: event_bookmark_event_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX event_bookmark_event_id_idx ON public.event_bookmark USING btree (event_id);
--> statement-breakpoint


--
-- Name: festival_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX festival_id ON public.badge_info USING btree (festival_id);
--> statement-breakpoint


--
-- Name: fki_cabin_festival_site_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX fki_cabin_festival_site_id ON public.cabin USING btree (festival_site_id);
--> statement-breakpoint


--
-- Name: fki_cabin_festival_site_id_fkey; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX fki_cabin_festival_site_id_fkey ON public.cabin USING btree (festival_site_id);
--> statement-breakpoint


--
-- Name: account account_application_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.account
    ADD CONSTRAINT account_application_id_fkey FOREIGN KEY (application_id) REFERENCES public.application(application_id);
--> statement-breakpoint


--
-- Name: account_password_reset_secret account_password_reset_secret_account_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.account_password_reset_secret
    ADD CONSTRAINT account_password_reset_secret_account_id_fkey FOREIGN KEY (account_id) REFERENCES public.account(account_id);
--> statement-breakpoint


--
-- Name: attendee attendee_age_range_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.attendee
    ADD CONSTRAINT attendee_age_range_fkey FOREIGN KEY (age_range) REFERENCES public.age_range(age_range);
--> statement-breakpoint


--
-- Name: attendee attendee_associated_account_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.attendee
    ADD CONSTRAINT attendee_associated_account_id_fkey FOREIGN KEY (associated_account_id) REFERENCES public.account(account_id);
--> statement-breakpoint


--
-- Name: attendee_cabin attendee_cabin_attendee_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.attendee_cabin
    ADD CONSTRAINT attendee_cabin_attendee_id_fkey FOREIGN KEY (attendee_id) REFERENCES public.attendee(attendee_id);
--> statement-breakpoint


--
-- Name: attendee_cabin attendee_cabin_cabin_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.attendee_cabin
    ADD CONSTRAINT attendee_cabin_cabin_id_fkey FOREIGN KEY (cabin_id) REFERENCES public.cabin(cabin_id);
--> statement-breakpoint


--
-- Name: attendee_cabin attendee_cabin_festival_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.attendee_cabin
    ADD CONSTRAINT attendee_cabin_festival_id_fkey FOREIGN KEY (festival_id) REFERENCES public.festival(festival_id);
--> statement-breakpoint


--
-- Name: attendee attendee_interested_in_volunteering_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.attendee
    ADD CONSTRAINT attendee_interested_in_volunteering_fkey FOREIGN KEY (interested_in_volunteering_as) REFERENCES public.volunteer_type(volunteer_type_id);
--> statement-breakpoint


--
-- Name: attendee attendee_special_diet_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.attendee
    ADD CONSTRAINT attendee_special_diet_fkey FOREIGN KEY (diet) REFERENCES public.diet(diet_id);
--> statement-breakpoint


--
-- Name: badge_info badge_info_attendee_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.badge_info
    ADD CONSTRAINT badge_info_attendee_id_fkey FOREIGN KEY (attendee_id) REFERENCES public.attendee(attendee_id);
--> statement-breakpoint


--
-- Name: badge_info badge_info_badge_picture_image_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.badge_info
    ADD CONSTRAINT badge_info_badge_picture_image_id_fkey FOREIGN KEY (badge_picture_image_id) REFERENCES public.stored_image(stored_image_id);
--> statement-breakpoint


--
-- Name: badge_info badge_info_festival_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.badge_info
    ADD CONSTRAINT badge_info_festival_id_fkey FOREIGN KEY (festival_id) REFERENCES public.festival(festival_id);
--> statement-breakpoint


--
-- Name: cabin cabin_festival_site_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cabin
    ADD CONSTRAINT cabin_festival_site_id_fkey FOREIGN KEY (festival_site_id) REFERENCES public.festival_site(festival_site_id);
--> statement-breakpoint


--
-- Name: discount discount_purchase_type_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.discount
    ADD CONSTRAINT discount_purchase_type_id_fkey FOREIGN KEY (purchase_type_id) REFERENCES public.purchase_type(purchase_type_id);
--> statement-breakpoint


--
-- Name: event_bookmark event_bookmark_account_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.event_bookmark
    ADD CONSTRAINT event_bookmark_account_id_fkey FOREIGN KEY (account_id) REFERENCES public.account(account_id);
--> statement-breakpoint


--
-- Name: event_bookmark event_bookmark_event_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.event_bookmark
    ADD CONSTRAINT event_bookmark_event_id_fkey FOREIGN KEY (event_id) REFERENCES public.event(event_id);
--> statement-breakpoint


--
-- Name: event event_created_by_account_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.event
    ADD CONSTRAINT event_created_by_account_id_fkey FOREIGN KEY (created_by_account_id) REFERENCES public.account(account_id);
--> statement-breakpoint


--
-- Name: event event_event_site_location_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.event
    ADD CONSTRAINT event_event_site_location_fkey FOREIGN KEY (event_site_location) REFERENCES public.event_site(event_site_id);
--> statement-breakpoint


--
-- Name: event event_event_type_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.event
    ADD CONSTRAINT event_event_type_fkey FOREIGN KEY (event_type) REFERENCES public.event_type(event_type_id);
--> statement-breakpoint


--
-- Name: event_site event_site_festival_site_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.event_site
    ADD CONSTRAINT event_site_festival_site_id_fkey FOREIGN KEY (festival_site_id) REFERENCES public.festival_site(festival_site_id);
--> statement-breakpoint


--
-- Name: faq_node faq_node_parent_faq_node_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.faq_node
    ADD CONSTRAINT faq_node_parent_faq_node_id_fkey FOREIGN KEY (parent_faq_node_id) REFERENCES public.faq_node(faq_node_id);
--> statement-breakpoint


--
-- Name: festival festival_festival_site_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.festival
    ADD CONSTRAINT festival_festival_site_id_fkey FOREIGN KEY (festival_site_id) REFERENCES public.festival_site(festival_site_id);
--> statement-breakpoint


--
-- Name: invite_code invite_code_created_by_account_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.invite_code
    ADD CONSTRAINT invite_code_created_by_account_id_fkey FOREIGN KEY (created_by_account_id) REFERENCES public.account(account_id);
--> statement-breakpoint


--
-- Name: invite_code invite_code_festival_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.invite_code
    ADD CONSTRAINT invite_code_festival_id_fkey FOREIGN KEY (festival_id) REFERENCES public.festival(festival_id);
--> statement-breakpoint


--
-- Name: invite_code invite_code_used_by_account_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.invite_code
    ADD CONSTRAINT invite_code_used_by_account_id_fkey FOREIGN KEY (used_by_account_id) REFERENCES public.account(account_id);
--> statement-breakpoint


--
-- Name: purchase purchase_applied_discount_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.purchase
    ADD CONSTRAINT purchase_applied_discount_fkey FOREIGN KEY (applied_discount) REFERENCES public.discount(discount_id);
--> statement-breakpoint


--
-- Name: purchase purchase_owned_by_account_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.purchase
    ADD CONSTRAINT purchase_owned_by_account_id_fkey FOREIGN KEY (owned_by_account_id) REFERENCES public.account(account_id);
--> statement-breakpoint


--
-- Name: purchase purchase_purchase_type_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.purchase
    ADD CONSTRAINT purchase_purchase_type_id_fkey FOREIGN KEY (purchase_type_id) REFERENCES public.purchase_type(purchase_type_id);
--> statement-breakpoint


--
-- Name: purchase_type purchase_type_festival_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.purchase_type
    ADD CONSTRAINT purchase_type_festival_id_fkey FOREIGN KEY (festival_id) REFERENCES public.festival(festival_id);
--> statement-breakpoint


--
-- Name: stored_image stored_image_owned_by_account_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.stored_image
    ADD CONSTRAINT stored_image_owned_by_account_id_fkey FOREIGN KEY (owned_by_account_id) REFERENCES public.account(account_id);
--> statement-breakpoint
