'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import { t } from '@/copy/t'
import useSettled from '@/hooks/useSettled'
import { useStore } from '@/hooks/useStore'
import { ACCOUNT_PATH, SUPPORT_EMAIL_HREF, TERMS_URL } from '@/lib/routes'
import { classNames } from '@/lib/ui'
import Icon from './core/Icon'
import Modal from './core/Modal'
import SearchField from './core/SearchField'
import { useMembersOnly } from './LoginPrompt'
import { useNav } from './NavStack'
import { useResolvedPageHeader } from './PageHeader'

export default function TopBar() {
    const pathname = usePathname()
    const store = useStore()
    const membersOnly = useMembersOnly()
    const header = useResolvedPageHeader(pathname)
    const nav = useNav()
    const [menu, setMenu] = useState(false)
    const searching = header.search?.inTopBar === true
    // the cross-fade is for hand-offs within a page; a new page, or a page first claiming a search, shows at once
    const settled = useSettled(`${pathname}|${header.search ? 'search' : ''}`)

    // biome-ignore lint/correctness/useExhaustiveDependencies: navigation closes the menu
    useEffect(() => {
        setMenu(false)
    }, [pathname])

    const email = store.accountInfo.state.result?.email_address

    return (
        <header className='top-bar'>
            <button
                type='button'
                className='icon-button'
                aria-label={t('nav.menu')}
                onClick={() => setMenu(true)}
            >
                <Icon name='menu' />
            </button>

            {nav.backHref && (
                <Link
                    href={nav.backHref}
                    className='icon-button'
                    aria-label={t('nav.back')}
                    data-nav-manual
                    onClick={(e) => {
                        e.preventDefault()
                        nav.back()
                    }}
                >
                    <Icon name='arrow_back' />
                </Link>
            )}

            <div
                className={classNames(
                    'top-bar-center',
                    searching && 'searching',
                    settled && 'animated',
                )}
            >
                <h1 className='title' inert={searching}>
                    {header.title}
                </h1>
                {header.search && (
                    <SearchField
                        search={header.search}
                        className='top-bar-search'
                        hidden={!searching}
                    />
                )}
            </div>

            <Modal side='left' isOpen={menu} onClose={() => setMenu(false)}>
                {() => (
                    <>
                        <div className='drawer-header'>
                            {/* biome-ignore lint/performance/noImgElement: small static logo sized by CSS */}
                            <img src='/vibecamp.png' alt='' />
                            <div className='drawer-identity'>
                                <span className='app-name'>{t('app.title')}</span>
                                {email && <span className='email'>{email}</span>}
                            </div>
                        </div>
                        <nav className='drawer-links'>
                            <Link
                                href={ACCOUNT_PATH}
                                className={pathname === ACCOUNT_PATH ? 'active' : undefined}
                                onClick={(e) => {
                                    if (membersOnly(ACCOUNT_PATH)) {
                                        e.preventDefault()
                                        setMenu(false)
                                    }
                                }}
                            >
                                <Icon name='person' />
                                {t('nav.account')}
                            </Link>
                            <a href={SUPPORT_EMAIL_HREF}>
                                <Icon name='mail' />
                                {t('nav.help')}
                            </a>
                            <a href={TERMS_URL} target='_blank' rel='noreferrer'>
                                <Icon name='gavel' />
                                {t('nav.legal')}
                                <Icon name='open_in_new' />
                            </a>
                        </nav>
                    </>
                )}
            </Modal>
        </header>
    )
}
