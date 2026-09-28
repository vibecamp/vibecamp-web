'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { t } from '@/copy/t'
import useIsOffline from '@/hooks/useIsOffline'
import { EVENTS_PATH, TICKETS_PATH } from '@/lib/routes'
import { classNames } from '@/lib/ui'
import Icon, { type MaterialIconName } from './core/Icon'

type NavTab = {
    readonly href: string
    readonly icon: MaterialIconName
    readonly label: string
}

const NAV_TABS: readonly NavTab[] = [
    { href: TICKETS_PATH, icon: 'confirmation_number', label: t('nav.tickets') },
    { href: EVENTS_PATH, icon: 'calendar_today', label: t('nav.events') },
]

const isTabActive = (pathname: string, href: string) =>
    pathname === href || pathname.startsWith(`${href}/`)

export default function Nav() {
    const pathname = usePathname()
    const isOffline = useIsOffline()

    return (
        <nav className='nav'>
            {NAV_TABS.map(({ href, icon, label }) => {
                const active = isTabActive(pathname, href)

                return (
                    <Link className={active ? 'active' : undefined} href={href} key={href}>
                        <Icon name={icon} fill={active ? 1 : 0} />
                        <span className='nav-label'>{label}</span>
                        <span className='pill' />
                    </Link>
                )
            })}

            <div className={classNames('offline-banner', !isOffline && 'hidden')}>
                {t('app.offlineBanner')}
            </div>
        </nav>
    )
}
