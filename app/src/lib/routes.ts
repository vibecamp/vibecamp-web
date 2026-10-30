import { t } from '@/copy/t'

export const DEFAULT_PATH = '/tickets'

export const LOGIN_PATH = '/login'
export const SIGNUP_PATH = '/signup'
export const FORGOT_PASSWORD_PATH = '/forgot-password'
export const RESET_PASSWORD_PATH = '/reset-password'

export const TICKETS_PATH = '/tickets'
export const SCHEDULE_PATH = '/schedule'
const EVENTS_PATH = '/events'
export const ACCOUNT_PATH = '/account'
export const MAP_PATH = '/map'
export const NEW_EVENT_PATH = `${EVENTS_PATH}/new`
export const CHECKOUT_RETURN_PATH = `${TICKETS_PATH}/checkout/return`

export const buyTicketsPath = (festivalId: string) =>
    `${TICKETS_PATH}/${encodeURIComponent(festivalId)}/buy`
export const eventPath = (eventId: string) => `${EVENTS_PATH}/${encodeURIComponent(eventId)}`
export const editEventPath = (eventId: string) => `${eventPath(eventId)}/edit`
export const locationPath = (locationId: string) => `/locations/${encodeURIComponent(locationId)}`
export const imagePath = (imageId: string) => `/images/${encodeURIComponent(imageId)}`

export const SUPPORT_EMAIL_HREF = `mailto:${t('login.supportEmailLinkText')}`
export const TERMS_URL = 'https://vibe.camp/terms'
export const DISCORD_URL = 'https://discord.gg/FnDCq3kXn4'
export const TWITTER_URL = 'https://x.com/vibecamp_'

export function safeNextPath(raw: string | null | undefined): string {
    return raw?.startsWith('/') && !raw.startsWith('//') ? raw : DEFAULT_PATH
}

export function withNext(path: string, next: string): string {
    const safe = safeNextPath(next)
    return safe === DEFAULT_PATH
        ? path
        : `${path}?${new URLSearchParams({ next: safe }).toString()}`
}

export const loginPath = (next: string = DEFAULT_PATH) => withNext(LOGIN_PATH, next)
export const landingPath = (next: string) => withNext('/', next)

export function isGuestPath(path: string): boolean {
    const pathname = path.split('?')[0] ?? ''
    return (
        pathname === SCHEDULE_PATH ||
        (/^\/events\/[^/]+$/.test(pathname) && pathname !== NEW_EVENT_PATH) ||
        pathname === TICKETS_PATH ||
        /^\/tickets\/[^/]+\/buy$/.test(pathname) ||
        pathname === MAP_PATH ||
        /^\/locations\/[^/]+$/.test(pathname)
    )
}
