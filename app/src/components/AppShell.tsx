'use client'

import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { type ReactNode, useEffect } from 'react'
import { useStore } from '@/hooks/useStore'
import { hashToPath } from '@/lib/hash-redirect'
import { isProtectedPath, loginPath } from '@/lib/routes'
import Stripes from './core/Stripes'
import Nav from './Nav'
import { PageHeaderProvider } from './PageHeader'
import PageLoading from './PageLoading'
import PageScroll from './PageScroll'
import { ToastProvider } from './Toast'
import TopBar from './TopBar'

export default function AppShell({ children }: { children: ReactNode }) {
    const store = useStore()
    const router = useRouter()
    const pathname = usePathname()
    const search = useSearchParams().toString()

    useEffect(() => {
        if (!store.ready || store.loggedIn) {
            return
        }

        const current = search === '' ? pathname : `${pathname}?${search}`
        const destination = hashToPath(window.location.hash) ?? current
        router.replace(isProtectedPath(destination) ? loginPath(destination) : destination)
    }, [pathname, router, search, store.loggedIn, store.ready])

    if (!store.ready || !store.loggedIn) {
        return <PageLoading />
    }

    return (
        <PageHeaderProvider>
            <ToastProvider>
                <Stripes position='bottom-right' />
                <TopBar />
                <PageScroll>{children}</PageScroll>
                <Nav />
            </ToastProvider>
        </PageHeaderProvider>
    )
}
