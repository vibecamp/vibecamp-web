export type Page = {
    page_id: string,
    title: string,
    content: string,
    permission_level: VisibilityLevel,
}

export const PERMISSION_LEVELS = ['public', 'applicants', 'ticket_holders', 'admins'] as const
export type VisibilityLevel = typeof PERMISSION_LEVELS[number]