'use client'

import { createContext, type ReactNode, useContext, useLayoutEffect, useState } from 'react'
import { screenInfo } from '@/lib/nav'

export type HeaderSearch = {
    value: string
    onChange: (value: string) => void
    placeholder: string
    inTopBar: boolean
    filter?: { active: boolean; label: string; onClick: () => void }
}

export type PageHeader = {
    title?: string
    search?: HeaderSearch
}

type Override = PageHeader | null

const HeaderContext = createContext<Override>(null)
// kept apart from the value so pages that set the header don't re-render when it changes
const SetHeaderContext = createContext<(next: Override) => void>(() => {})

export function PageHeaderProvider({ children }: { children: ReactNode }) {
    const [override, setOverride] = useState<Override>(null)
    return (
        <SetHeaderContext.Provider value={setOverride}>
            <HeaderContext.Provider value={override}>{children}</HeaderContext.Provider>
        </SetHeaderContext.Provider>
    )
}

export function usePageHeader(header: PageHeader | null) {
    const setOverride = useContext(SetHeaderContext)
    const active = header != null
    const title = header?.title
    const search = header?.search
    useLayoutEffect(() => {
        setOverride(active ? { title, search } : null)
    }, [active, search, setOverride, title])
    useLayoutEffect(() => () => setOverride(null), [setOverride])
}

export function useResolvedPageHeader(pathname: string): { title: string; search?: HeaderSearch } {
    const override = useContext(HeaderContext)
    return { title: override?.title ?? screenInfo(pathname).title, search: override?.search }
}
