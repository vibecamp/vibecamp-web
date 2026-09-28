import { t } from '@/copy/t'

export const DEFAULT_PATH = '/tickets'

export const LOGIN_PATH = '/login'
export const SIGNUP_PATH = '/signup'
export const FORGOT_PASSWORD_PATH = '/forgot-password'
export const RESET_PASSWORD_PATH = '/reset-password'

export const TICKETS_PATH = '/tickets'
export const EVENTS_PATH = '/events'
export const ACCOUNT_PATH = '/account'
export const NEW_EVENT_PATH = `${EVENTS_PATH}/new`

export const buyTicketsPath = (festivalId: string) =>
    `${TICKETS_PATH}/${encodeURIComponent(festivalId)}/buy`
export const eventPath = (eventId: string) => `${EVENTS_PATH}/${encodeURIComponent(eventId)}`
export const editEventPath = (eventId: string) => `${eventPath(eventId)}/edit`

export const SUPPORT_EMAIL_HREF = `mailto:${t('login.supportEmailLinkText')}`
export const TERMS_URL = 'https://vibe.camp/terms'

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

const PROTECTED_PATHS = [TICKETS_PATH, EVENTS_PATH, ACCOUNT_PATH] as const

export const isProtectedPath = (path: string) =>
    PROTECTED_PATHS.some((p) => path === p || path.startsWith(`${p}/`) || path.startsWith(`${p}?`))
