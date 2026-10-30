'use client'

import { usePathname, useSearchParams } from 'next/navigation'
import { type ReactNode, useEffect } from 'react'
import { useStore } from '@/hooks/useStore'
import { hashToPath } from '@/lib/hash-redirect'
import { isGuestPath, landingPath } from '@/lib/routes'
import Stripes from './core/Stripes'
import { LoginPromptProvider } from './LoginPrompt'
import Nav from './Nav'
import { useNav } from './NavStack'
import { PageHeaderProvider } from './PageHeader'
import PageLoading from './PageLoading'
import PageScroll from './PageScroll'
import { ToastProvider } from './Toast'
import TopBar from './TopBar'

export default function AppShell({ children }: { children: ReactNode }) {
    const store = useStore()
    const { replace } = useNav()
    const pathname = usePathname()
    const search = useSearchParams().toString()

    useEffect(() => {
        if (!store.ready || store.loggedIn) {
            return
        }

        const current = search === '' ? pathname : `${pathname}?${search}`
        const destination = hashToPath(window.location.hash) ?? current
        if (!isGuestPath(destination)) {
            replace(landingPath(destination))
        } else if (destination !== current) {
            replace(destination)
        }
    }, [pathname, replace, search, store.loggedIn, store.ready])

    // the shell renders even while loading, so the first paint already has the bars around the spinner
    const allowed = store.ready && (store.loggedIn || isGuestPath(pathname))

    return (
        <PageHeaderProvider>
            <ToastProvider>
                <LoginPromptProvider>
                    <Stripes position='bottom-right' />
                    <TopBar />
                    <PageScroll>{allowed ? children : <PageLoading />}</PageScroll>
                    <Nav />
                </LoginPromptProvider>
            </ToastProvider>
        </PageHeaderProvider>
    )
}
