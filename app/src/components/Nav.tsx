'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import type { CSSProperties } from 'react'
import { t } from '@/copy/t'
import useIsOffline from '@/hooks/useIsOffline'
import { EVENTS_PATH, isGuestPath, TICKETS_PATH } from '@/lib/routes'
import { classNames } from '@/lib/ui'
import Icon, { type MaterialIconName } from './core/Icon'
import { useMembersOnly } from './LoginPrompt'

type NavTab = {
    readonly href: string
    readonly icon: MaterialIconName
    readonly label: string
}

const NAV_TABS: readonly NavTab[] = [
    { href: TICKETS_PATH, icon: 'confirmation_number', label: t('nav.tickets') },
    { href: EVENTS_PATH, icon: 'calendar_today', label: t('nav.schedule') },
]

const isTabActive = (pathname: string, href: string) =>
    pathname === href || pathname.startsWith(`${href}/`)

export default function Nav() {
    const pathname = usePathname()
    const isOffline = useIsOffline()
    const membersOnly = useMembersOnly()
    const activeIndex = NAV_TABS.findIndex(({ href }) => isTabActive(pathname, href))
    const indicator = {
        '--tabs': NAV_TABS.length,
        '--active': Math.max(activeIndex, 0),
    } as CSSProperties

    return (
        <nav className={classNames('nav', activeIndex >= 0 && 'has-active')} style={indicator}>
            {NAV_TABS.map(({ href, icon, label }) => {
                const active = isTabActive(pathname, href)

                return (
                    <Link
                        className={active ? 'active' : undefined}
                        href={href}
                        key={href}
                        onClick={(e) => {
                            if (!isGuestPath(href) && membersOnly(href)) e.preventDefault()
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
