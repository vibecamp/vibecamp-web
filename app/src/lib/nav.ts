import { t } from '@/copy/t'
import {
    ACCOUNT_PATH,
    CHECKOUT_RETURN_PATH,
    eventPath,
    FORGOT_PASSWORD_PATH,
    LOGIN_PATH,
    MAP_PATH,
    RESET_PASSWORD_PATH,
    SCHEDULE_PATH,
    SIGNUP_PATH,
    TICKETS_PATH,
} from './routes'

export type Tab = 'tickets' | 'schedule' | 'map' | 'account'

export const TAB_ROOTS: Record<Tab, string> = {
    tickets: TICKETS_PATH,
    schedule: SCHEDULE_PATH,
    map: MAP_PATH,
    account: ACCOUNT_PATH,
}

export type Screen = { url: string; key: string }

type Entry = Screen & { tab: Tab | undefined; stack: readonly Screen[] }

export type NavState = {
    entries: readonly Entry[]
    cursor: number
    stacks: Partial<Record<Tab, readonly Screen[]>>
    tab: Tab | undefined
    direction: 'forward' | 'back' | 'same'
}

export type Intent =
    | { kind: 'traverse' }
    | { kind: 'replace' }
    | { kind: 'reset' }
    | { kind: 'tab'; tab: Tab }
    | { kind: 'pop'; stack: readonly Screen[] }

const EXCLUDED = ['/', LOGIN_PATH, SIGNUP_PATH, FORGOT_PASSWORD_PATH, RESET_PASSWORD_PATH]

export const pathOf = (url: string) => url.split('?')[0] ?? url

export function normalizeUrl(url: string): string {
    const parsed = new URL(url, 'http://localhost')
    const search = parsed.searchParams.toString()
    return search ? `${parsed.pathname}?${search}` : parsed.pathname
}

export function tabOf(pathname: string): Tab | undefined {
    const root = `/${pathname.split('/')[1] ?? ''}`
    if (root === TICKETS_PATH) return 'tickets'
    if (root === SCHEDULE_PATH || root === '/events') return 'schedule'
    if (root === MAP_PATH || root === '/locations') return 'map'
    if (root === ACCOUNT_PATH) return 'account'
    return undefined
}

const isTabRoot = (pathname: string) => Object.values(TAB_ROOTS).includes(pathname)

const isExcluded = (pathname: string) =>
    EXCLUDED.includes(pathname) || pathname === CHECKOUT_RETURN_PATH

export function screenInfo(pathname: string): { title: string; parent?: string } {
    const [root, second, third, fourth] = pathname.split('/').filter(Boolean)

    if (root === 'tickets') {
        if (second === 'owned' && third != null) {
            const detail = `${TICKETS_PATH}/owned/${third}`
            if (fourth === 'addons') return { title: t('tickets.purchaseAddons'), parent: detail }
            return { title: t('nav.tickets'), parent: TICKETS_PATH }
        }
        if (third === 'buy') return { title: t('tickets.buyTickets'), parent: TICKETS_PATH }
        if (second === 'checkout') return { title: t('nav.tickets'), parent: TICKETS_PATH }
        return { title: t('nav.tickets') }
    }
    if (root === 'events') {
        if (second === 'new') return { title: t('events.createEvent'), parent: SCHEDULE_PATH }
        if (second != null && third === 'edit')
            return { title: t('common.edit'), parent: eventPath(second) }
        // an event page's title is the event's name, which it supplies once loaded
        if (second != null) return { title: '', parent: SCHEDULE_PATH }
        return { title: t('nav.schedule') }
    }
    if (root === 'schedule') return { title: t('nav.schedule') }
    if (root === 'map') return { title: t('nav.map') }
    if (root === 'locations') return { title: '', parent: MAP_PATH }
    if (root === 'account') return { title: t('account.title') }
    return { title: t('app.title') }
}

function parentsChain(url: string, makeKey: () => string): Screen[] {
    const chain = [url]
    for (let parent = screenInfo(pathOf(url)).parent; parent; ) {
        chain.unshift(parent)
        parent = screenInfo(parent).parent
    }
    return chain.map((u) => ({ url: u, key: makeKey() }))
}

function withStack(state: NavState, tab: Tab | undefined, stack: readonly Screen[]) {
    return tab && stack.length > 0 ? { ...state.stacks, [tab]: stack } : state.stacks
}

function fresh(url: string, makeKey: () => string): NavState {
    const stack = isExcluded(pathOf(url)) ? [] : parentsChain(url, makeKey)
    const tab = stack[0] ? tabOf(pathOf(stack[0].url)) : undefined
    const key = stack.at(-1)?.key ?? makeKey()
    return {
        entries: [{ url, key, tab, stack }],
        cursor: 0,
        stacks: tab ? { [tab]: stack } : {},
        tab,
        direction: 'same',
    }
}

function traverse(state: NavState, url: string, makeKey: () => string): NavState {
    const near = [state.cursor - 1, state.cursor + 1]
    const index =
        near.find((i) => state.entries[i]?.url === url) ??
        state.entries.findLastIndex((e, i) => e.url === url && i < state.cursor)
    const entry = state.entries[index]
    if (index < 0 || entry == null) return fresh(url, makeKey)
    return {
        ...state,
        cursor: index,
        stacks: withStack(state, entry.tab, entry.stack),
        tab: entry.tab ?? state.tab,
        direction: index < state.cursor ? 'back' : 'forward',
    }
}

function replace(
    state: NavState,
    url: string,
    intent: Intent | undefined,
    makeKey: () => string,
): NavState {
    const current = state.entries[state.cursor]
    const pathname = pathOf(url)
    let tab = current?.tab ?? state.tab
    let stack: readonly Screen[]

    if (isExcluded(pathname)) {
        stack = []
    } else if (intent?.kind === 'pop') {
        stack = intent.stack
    } else if (intent?.kind === 'reset' || !current?.stack.length) {
        stack = parentsChain(url, makeKey)
        tab = stack[0] ? tabOf(pathOf(stack[0].url)) : tab
    } else if (isTabRoot(pathname)) {
        const top = current.stack.at(-1)
        tab = tabOf(pathname)
        stack = [{ url, key: top && pathOf(top.url) === pathname ? top.key : makeKey() }]
    } else {
        const below = current.stack.slice(0, -1)
        const top = current.stack.at(-1)
        stack =
            below.at(-1)?.url === url
                ? below
                : [
                      ...below,
                      { url, key: top && pathOf(top.url) === pathname ? top.key : makeKey() },
                  ]
    }

    const entries = [...state.entries]
    entries[state.cursor] = { url, key: stack.at(-1)?.key ?? makeKey(), tab, stack }
    return {
        ...state,
        entries,
        stacks: withStack(state, tab, stack),
        tab,
        direction: intent?.kind === 'pop' ? 'back' : 'same',
    }
}

function push(
    state: NavState,
    url: string,
    intent: Intent | undefined,
    makeKey: () => string,
): NavState {
    const pathname = pathOf(url)
    let tab = state.tab
    let stack: readonly Screen[]

    if (isExcluded(pathname)) {
        stack = []
    } else if (intent?.kind === 'tab') {
        tab = intent.tab
        const saved = state.stacks[tab]
        stack = saved?.at(-1)?.url === url ? saved : parentsChain(url, makeKey)
    } else if (isTabRoot(pathname)) {
        tab = tabOf(pathname)
        stack = [{ url, key: makeKey() }]
    } else {
        const current = tab ? state.stacks[tab] : undefined
        if (!current?.length || !state.entries[state.cursor]?.stack.length) {
            stack = parentsChain(url, makeKey)
            tab = stack[0] ? tabOf(pathOf(stack[0].url)) : tab
        } else {
            stack = current.at(-1)?.url === url ? current : [...current, { url, key: makeKey() }]
        }
    }

    return {
        entries: [
            ...state.entries.slice(0, state.cursor + 1),
            { url, key: stack.at(-1)?.key ?? makeKey(), tab, stack },
        ],
        cursor: state.cursor + 1,
        stacks: withStack(state, tab, stack),
        tab,
        direction: intent?.kind === 'tab' ? 'same' : 'forward',
    }
}

export function applyCommit(
    state: NavState | null,
    url: string,
    intent: Intent | undefined,
    makeKey: () => string,
): NavState {
    if (state == null) return fresh(url, makeKey)
    if (intent?.kind === 'traverse') return traverse(state, url, makeKey)
    if (intent?.kind === 'replace' || intent?.kind === 'reset' || intent?.kind === 'pop')
        return replace(state, url, intent, makeKey)
    return push(state, url, intent, makeKey)
}
