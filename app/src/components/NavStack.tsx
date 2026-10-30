'use client'

import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import {
    createContext,
    type MouseEvent,
    type ReactNode,
    useCallback,
    useContext,
    useEffect,
    useLayoutEffect,
    useMemo,
    useRef,
    useState,
} from 'react'
import {
    applyCommit,
    type Intent,
    type NavState,
    normalizeUrl,
    type Screen,
    TAB_ROOTS,
    type Tab,
} from '@/lib/nav'

type ScreenState = {
    scrollTop?: number
    mapView?: { x: number; y: number; resolution: number; zoom: number; maxZoom: number }
    mapFilters?: { query: string; hidden: readonly string[] }
    searchText?: string
}

type Nav = {
    tab: Tab | undefined
    screenKey: string | undefined
    screenUrl: string | undefined
    backHref: string | undefined
    reselected: number
    back: (options?: { skip?: (url: string) => boolean }) => void
    push: (href: string) => void
    replace: (href: string) => void
    reset: (href: string) => void
    leaveExcluded: (next: string) => void
    tabHref: (tab: Tab) => string
    selectTab: (tab: Tab, event: MouseEvent) => void
    getScreenState: (key: string) => ScreenState | undefined
    setScreenState: (key: string, patch: ScreenState) => void
}

const NavContext = createContext<Nav | null>(null)

const stackOf = (state: NavState | null) => (state?.tab && state.stacks[state.tab]) || []

let keyCounter = 0
const makeKey = () => `s${++keyCounter}`

export function NavStackProvider({ children }: { children: ReactNode }) {
    const pathname = usePathname()
    const search = useSearchParams().toString()
    const router = useRouter()
    const url = normalizeUrl(search ? `${pathname}?${search}` : pathname)

    const stateRef = useRef<NavState | null>(null)
    const pending = useRef<{ url: string; intent: Intent } | null>(null)
    const screens = useRef(new Map<string, ScreenState>())
    const [reselected, setReselected] = useState(0)

    // worked out in the render that first sees a new URL, so pages restore from the right screen
    const [committed, setCommitted] = useState(() => ({
        url,
        state: applyCommit(null, url, undefined, makeKey),
    }))
    let current = committed
    if (committed.url !== url) {
        const prev = committed.state
        const intent = pending.current?.url === url ? pending.current.intent : undefined
        const unchanged = !intent && prev.entries[prev.cursor]?.url === url
        current = { url, state: unchanged ? prev : applyCommit(prev, url, intent, makeKey) }
        setCommitted(current)
    }
    const state = current.state

    useEffect(() => {
        const onPop = () => {
            pending.current = {
                url: normalizeUrl(window.location.pathname + window.location.search),
                intent: { kind: 'traverse' },
            }
        }
        window.addEventListener('popstate', onPop)
        return () => {
            window.removeEventListener('popstate', onPop)
        }
    }, [])

    // biome-ignore lint/correctness/useExhaustiveDependencies: a pending intent is consumed once its URL arrives
    useLayoutEffect(() => {
        pending.current = null
    }, [url])

    useLayoutEffect(() => {
        stateRef.current = state
        document.documentElement.dataset.nav = state.direction
    }, [state])

    const navigate = useCallback(
        (href: string, intent: Intent) => {
            pending.current = { url: normalizeUrl(href), intent }
            router.replace(href, { scroll: false })
        },
        [router],
    )

    const popTo = useCallback(
        (stack: readonly Screen[], index: number) => {
            const current = stateRef.current
            const target = stack[index]
            if (!current || !target) return
            const n = stack.length - 1 - index
            const historyMatches = Array.from(
                { length: n },
                (_, k) => current.entries[current.cursor - 1 - k]?.key === stack.at(-2 - k)?.key,
            ).every(Boolean)
            if (historyMatches) window.history.go(-n)
            else navigate(target.url, { kind: 'pop', stack: stack.slice(0, index + 1) })
        },
        [navigate],
    )

    const back = useCallback(
        (options?: { skip?: (url: string) => boolean }) => {
            const stack = stackOf(stateRef.current)
            let index = stack.length - 2
            while (index > 0 && options?.skip?.(stack[index]?.url ?? '')) index--
            if (index < 0) return
            popTo(stack, index)
        },
        [popTo],
    )

    const push = useCallback(
        (href: string) => {
            router.push(href)
        },
        [router],
    )
    const replace = useCallback((href: string) => navigate(href, { kind: 'replace' }), [navigate])
    const reset = useCallback((href: string) => navigate(href, { kind: 'reset' }), [navigate])

    const leaveExcluded = useCallback(
        (next: string) => {
            const current = stateRef.current
            const before =
                current?.entries
                    .slice(0, current.cursor)
                    .findLastIndex((e) => e.stack.length > 0) ?? -1
            if (current && before >= 0 && current.entries[before]?.url === normalizeUrl(next)) {
                window.history.go(before - current.cursor)
            } else {
                navigate(next, { kind: 'replace' })
            }
        },
        [navigate],
    )

    const selectTab = useCallback(
        (tab: Tab, event: MouseEvent) => {
            const current = stateRef.current
            if (tab !== current?.tab) {
                const href = current?.stacks[tab]?.at(-1)?.url ?? TAB_ROOTS[tab]
                pending.current = { url: normalizeUrl(href), intent: { kind: 'tab', tab } }
                return
            }
            event.preventDefault()
            const stack = stackOf(stateRef.current)
            if (stack.length > 1) {
                popTo(stack, 0)
            } else setReselected((n) => n + 1)
        },
        [popTo],
    )

    const getScreenState = useCallback((key: string) => screens.current.get(key), [])
    const setScreenState = useCallback(
        (key: string, patch: ScreenState) =>
            screens.current.set(key, { ...screens.current.get(key), ...patch }),
        [],
    )

    const value = useMemo((): Nav => {
        const stack = stackOf(state)
        return {
            tab: state?.tab,
            screenKey: state?.entries[state.cursor]?.key,
            screenUrl: state?.entries[state.cursor]?.url,
            backHref: stack.at(-2)?.url,
            reselected,
            back,
            push,
            replace,
            reset,
            leaveExcluded,
            tabHref: (t) => state?.stacks[t]?.at(-1)?.url ?? TAB_ROOTS[t],
            selectTab,
            getScreenState,
            setScreenState,
        }
    }, [
        back,
        push,
        getScreenState,
        leaveExcluded,
        replace,
        reselected,
        reset,
        selectTab,
        setScreenState,
        state,
    ])

    return <NavContext.Provider value={value}>{children}</NavContext.Provider>
}

export function useNav(): Nav {
    const nav = useContext(NavContext)
    if (nav == null) throw new Error('useNav() must be used inside <NavStackProvider>')
    return nav
}
