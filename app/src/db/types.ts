import type * as s from './schema'

export type Tables = {
    checkout_order: typeof s.checkout_order.$inferSelect
    ticket_badge: typeof s.ticket_badge.$inferSelect
    discount_code: typeof s.discount_code.$inferSelect
    discount_code_ticket_type: typeof s.discount_code_ticket_type.$inferSelect
    discount_code_addon_type: typeof s.discount_code_addon_type.$inferSelect
    purchase_type_addon: typeof s.purchase_type_addon.$inferSelect
    purchase_type_addon_exclusion: typeof s.purchase_type_addon_exclusion.$inferSelect
    account: typeof s.account.$inferSelect
    account_password_reset_secret: typeof s.account_password_reset_secret.$inferSelect
    age_range: typeof s.age_range.$inferSelect
    announcement: typeof s.announcement.$inferSelect
    application: typeof s.application.$inferSelect
    attendee: typeof s.attendee.$inferSelect
    attendee_cabin: typeof s.attendee_cabin.$inferSelect
    badge_info: typeof s.badge_info.$inferSelect
    cabin: typeof s.cabin.$inferSelect
    diet: typeof s.diet.$inferSelect
    discount: typeof s.discount.$inferSelect
    event: typeof s.event.$inferSelect
    event_bookmark: typeof s.event_bookmark.$inferSelect
    event_site: typeof s.event_site.$inferSelect
    event_type: typeof s.event_type.$inferSelect
    faq_node: typeof s.faq_node.$inferSelect
    festival: typeof s.festival.$inferSelect
    festival_site: typeof s.festival_site.$inferSelect
    invite_code: typeof s.invite_code.$inferSelect
    purchase: typeof s.purchase.$inferSelect
    purchase_type: typeof s.purchase_type.$inferSelect
    stored_image: typeof s.stored_image.$inferSelect
    volunteer_type: typeof s.volunteer_type.$inferSelect
    purchase_sorted: typeof s.purchase_sorted.$inferSelect
}

export type TableName = keyof Tables
