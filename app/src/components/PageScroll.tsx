'use client'

import {
    createContext,
    type ReactNode,
    useCallback,
    useContext,
    useEffect,
    useLayoutEffect,
    useMemo,
    useRef,
    useState,
} from 'react'
import useElementEvent from '@/hooks/useElementEvent'
import { doNothing } from '@/lib/ui'
import { useNav } from './NavStack'

const ScrollContext = createContext({ scrollTop: 0, scrollToTop: doNothing })

const RESTORE_TIMEOUT_MS = 1000

export default function PageScroll({ children }: { children: ReactNode }) {
    const [ref, setRef] = useState<HTMLElement | null>(null)
    const [scrollTop, setScrollTop] = useState(0)
    const nav = useNav()
    const keyRef = useRef(nav.screenKey)
    const scrollToTop = useCallback(() => ref?.scrollTo({ top: 0, behavior: 'smooth' }), [ref])
    const { screenKey, getScreenState, setScreenState, reselected } = nav

    const onScroll = useCallback(
        (_: Event, el: HTMLElement) => {
            setScrollTop(el.scrollTop)
            if (keyRef.current) setScreenState(keyRef.current, { scrollTop: el.scrollTop })
        },
        [setScreenState],
    )
    useElementEvent(ref, 'scroll', onScroll)

    // biome-ignore lint/correctness/useExhaustiveDependencies: restores only when the screen changes
    useLayoutEffect(() => {
        keyRef.current = screenKey
        if (!ref || !screenKey) return
        const target = getScreenState(screenKey)?.scrollTop ?? 0
        ref.scrollTop = target
        setScrollTop(ref.scrollTop)
        if (ref.scrollTop >= target - 1) return

        // the screen's content may still be loading, so keep trying until it's tall enough
        const deadline = performance.now() + RESTORE_TIMEOUT_MS
        const inputs = ['wheel', 'touchstart', 'keydown'] as const
        let frame = requestAnimationFrame(function retry(now) {
            ref.scrollTop = target
            if (ref.scrollTop < target - 1 && now < deadline) frame = requestAnimationFrame(retry)
            else stop()
        })
        function stop() {
            cancelAnimationFrame(frame)
            for (const type of inputs) ref?.removeEventListener(type, stop)
        }
        for (const type of inputs) ref.addEventListener(type, stop)
        return stop
    }, [ref, screenKey])

    useEffect(() => {
        if (reselected > 0) scrollToTop()
    }, [reselected, scrollToTop])

    const value = useMemo(() => ({ scrollTop, scrollToTop }), [scrollToTop, scrollTop])

    return (
        <main className='page-scroll' ref={setRef}>
            <ScrollContext.Provider value={value}>{children}</ScrollContext.Provider>
        </main>
    )
}

export function usePageScroll() {
    return useContext(ScrollContext)
}
