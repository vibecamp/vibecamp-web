export type Page = {
    page_id: string,
    title: string,
    content: string,
    visibility_level: VisibilityLevel,
}

export const VISIBILITY_LEVELS = ['public', 'applicants', 'ticket_holders', 'admins'] as const
export type VisibilityLevel = typeof VISIBILITY_LEVELS[number]