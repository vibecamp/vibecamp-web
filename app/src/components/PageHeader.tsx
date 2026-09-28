'use client'

import { createContext, type ReactNode, useContext, useEffect, useMemo, useState } from 'react'
import { t } from '@/copy/t'
import { EVENTS_PATH, eventPath, TICKETS_PATH } from '@/lib/routes'

export type PageHeader = {
    title: string
    back?: string
}

type Override = PageHeader | null

const PageHeaderContext = createContext<{
    override: Override
    setOverride: (next: Override) => void
}>({ override: null, setOverride: () => {} })

export function PageHeaderProvider({ children }: { children: ReactNode }) {
    const [override, setOverride] = useState<Override>(null)
    const value = useMemo(() => ({ override, setOverride }), [override])
    return <PageHeaderContext.Provider value={value}>{children}</PageHeaderContext.Provider>
}

export function usePageHeader(header: PageHeader | null) {
    const { setOverride } = useContext(PageHeaderContext)
    const title = header?.title
    const back = header?.back
    useEffect(() => {
        setOverride(title == null ? null : { title, back })
        return () => setOverride(null)
    }, [back, setOverride, title])
}

export function useResolvedPageHeader(pathname: string): PageHeader {
    const { override } = useContext(PageHeaderContext)
    return override ?? defaultHeader(pathname)
}

const segments = (pathname: string) => pathname.split('/').filter(Boolean)

function defaultHeader(pathname: string): PageHeader {
    const parts = segments(pathname)
    const [root, second, third, fourth] = parts

    if (root === 'tickets') {
        if (second === 'owned' && third != null) {
            const detail = `${TICKETS_PATH}/owned/${third}`
            if (fourth === 'badge') return { title: t('account.badgeInfoHeading'), back: detail }
            if (fourth === 'addons') return { title: t('tickets.purchaseAddons'), back: detail }
            return { title: t('nav.tickets'), back: TICKETS_PATH }
        }
        if (third === 'buy') return { title: t('tickets.buyTickets'), back: TICKETS_PATH }
        if (second === 'checkout') return { title: t('nav.tickets'), back: TICKETS_PATH }
        return { title: t('nav.tickets') }
    }
    if (root === 'events') {
        if (second === 'new') return { title: t('events.createEvent'), back: EVENTS_PATH }
        if (second != null && third === 'edit')
            return { title: t('common.edit'), back: eventPath(second) }
        if (second != null) return { title: t('nav.events'), back: EVENTS_PATH }
        return { title: t('nav.events') }
    }
    if (root === 'account') return { title: t('account.title') }
    return { title: t('app.title') }
}
