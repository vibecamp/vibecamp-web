export type Page = {
    page_id: string,
    title: string,
    content: string,
    permission_level: PermissionLevel,
}

export const PERMISSION_LEVELS = ['public', 'applicant', 'ticket_holder', 'admin'] as const
export type PermissionLevel = typeof PERMISSION_LEVELS[number]

export type User = {
    user_id: number,
    user_name: string,
    permission_level: PermissionLevel,
    email: string | null,
    password_hash: string | null,
    password_salt: string
}

export type NavLink = {
    href: string,
    label: string,
    nav_order: number
}