'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import type { CSSProperties } from 'react'
import { t } from '@/copy/t'
import useIsOffline from '@/hooks/useIsOffline'
import { TAB_ROOTS, type Tab, tabOf } from '@/lib/nav'
import { isGuestPath } from '@/lib/routes'
import { classNames } from '@/lib/ui'
import Icon, { type MaterialIconName } from './core/Icon'
import { useMembersOnly } from './LoginPrompt'
import { useNav } from './NavStack'

type NavTab = {
    readonly tab: Tab
    readonly icon: MaterialIconName
    readonly label: string
}

const NAV_TABS: readonly NavTab[] = [
    { tab: 'tickets', icon: 'confirmation_number', label: t('nav.tickets') },
    { tab: 'schedule', icon: 'calendar_today', label: t('nav.schedule') },
    { tab: 'map', icon: 'map', label: t('nav.map') },
]

export default function Nav() {
    const pathname = usePathname()
    const isOffline = useIsOffline()
    const membersOnly = useMembersOnly()
    const nav = useNav()
    const current = nav.tab ?? tabOf(pathname)
    const activeIndex = NAV_TABS.findIndex(({ tab }) => tab === current)
    const indicator = {
        '--tabs': NAV_TABS.length,
        '--active': Math.max(activeIndex, 0),
    } as CSSProperties

    return (
        <nav
            className={classNames('nav', activeIndex >= 0 && 'has-active')}
            style={indicator}
            data-nav-manual
        >
            {NAV_TABS.map(({ tab, icon, label }) => {
                const active = tab === current
                const href = nav.tabHref(tab)

                return (
                    <Link
                        className={active ? 'active' : undefined}
                        href={href}
                        key={tab}
                        prefetch
                        scroll={false}
                        onClick={(e) => {
                            if (!isGuestPath(TAB_ROOTS[tab]) && membersOnly(href)) {
                                e.preventDefault()
                                return
                            }
                            nav.selectTab(tab, e)
                        }}
                    >
                        <Icon name={icon} fill={active ? 1 : 0} />
                        <span className='nav-label'>{label}</span>
                    </Link>
                )
            })}

            <div className={classNames('offline-banner', !isOffline && 'hidden')}>
                {t('app.offlineBanner')}
            </div>
        </nav>
    )
}
