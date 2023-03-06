
export type NavLink = {
    href: string,
    label: string,
    nav_order: number
}

export type Page = {
    page_id: string,
    title: string,
    content: string,
}

export type User = {
    user_id: number,
    email: string,
    password_hash: string,
    password_salt: string,
    twitter_name: string | null,
    name: string | null,
    is_content_admin: boolean,
    is_account_admin: boolean,
}

export type VibeJWTPayload = {
    is_content_admin: boolean,
    is_account_admin: boolean,
}