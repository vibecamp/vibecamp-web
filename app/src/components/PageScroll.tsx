'use client'

import { createContext, type ReactNode, useCallback, useContext, useMemo, useState } from 'react'
import useElementEvent from '@/hooks/useElementEvent'
import { doNothing } from '@/lib/ui'

const ScrollContext = createContext({ scrollTop: 0, scrollToTop: doNothing })

export default function PageScroll({ children }: { children: ReactNode }) {
    const [ref, setRef] = useState<HTMLElement | null>(null)
    const [scrollTop, setScrollTop] = useState(0)
    const scrollToTop = useCallback(() => ref?.scrollTo({ top: 0, behavior: 'smooth' }), [ref])

    useElementEvent(ref, 'scroll', (_, el) => setScrollTop(el.scrollTop))

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
