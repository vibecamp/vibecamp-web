'use client'

import Link from 'next/link'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'
import { t } from '@/copy/t'
import { useStore } from '@/hooks/useStore'
import { EVENTS_FILTERS, type EventsFilter } from '@/lib/hash-redirect'
import { ACCOUNT_PATH, EVENTS_PATH, SUPPORT_EMAIL_HREF, TERMS_URL } from '@/lib/routes'
import { classNames } from '@/lib/ui'
import Button from './core/Button'
import Icon from './core/Icon'
import Modal from './core/Modal'
import { useResolvedPageHeader } from './PageHeader'

const FILTER_LABELS = {
    All: 'events.filterAll',
    Bookmarks: 'events.filterBookmarks',
    Mine: 'events.filterMine',
    Past: 'events.filterPast',
} as const satisfies Record<EventsFilter, string>

export default function TopBar() {
    const pathname = usePathname()
    const search = useSearchParams()
    const router = useRouter()
    const store = useStore()
    const header = useResolvedPageHeader(pathname)

    const [menu, setMenu] = useState(false)
    const [filters, setFilters] = useState(false)
    const [expanded, setExpanded] = useState(false)
    const [closedQuery, setClosedQuery] = useState<string | null>(null)
    const inputRef = useRef<HTMLInputElement>(null)

    const isEvents = pathname === EVENTS_PATH
    const hasNonDefault = Boolean(search.get('q') || search.get('filter') || search.get('compact'))
    const searchOpen =
        isEvents && (expanded || (hasNonDefault && closedQuery !== search.toString()))
    const filterActive = Boolean(search.get('filter') || search.get('compact'))

    // biome-ignore lint/correctness/useExhaustiveDependencies: navigation closes panels
    useEffect(() => {
        setMenu(false)
        setFilters(false)
    }, [pathname])

    useEffect(() => {
        if (searchOpen) inputRef.current?.focus()
    }, [searchOpen])

    function query(changes: Record<string, string | null>) {
        const params = new URLSearchParams(search.toString())
        for (const [key, value] of Object.entries(changes)) {
            if (value) params.set(key, value)
            else params.delete(key)
        }
        router.replace(`${pathname}${params.size ? `?${params}` : ''}`, { scroll: false })
    }

    function closeSearch() {
        const next = new URLSearchParams(search.toString())
        next.delete('q')
        setClosedQuery(next.toString())
        query({ q: null })
        setExpanded(false)
        setFilters(false)
    }

    const email = store.accountInfo.state.result?.email_address

    return (
        <header className='top-bar'>
            <button type='button' className='icon-button' onClick={() => setMenu(true)}>
                <Icon name='menu' />
            </button>

            {header.back && !searchOpen && (
                <Link href={header.back} className='icon-button'>
                    <Icon name='arrow_back' />
                </Link>
            )}

            {searchOpen ? (
                <>
                    <div className='search-field'>
                        <Icon name='search' />
                        <input
                            ref={inputRef}
                            type='search'
                            placeholder={t('events.searchPlaceholder')}
                            value={search.get('q') ?? ''}
                            onChange={(e) => query({ q: e.target.value })}
                            onKeyDown={(e) => {
                                if (e.key === 'Escape') closeSearch()
                            }}
                        />
                    </div>
                    <button
                        type='button'
                        className={classNames('icon-button', filterActive && 'active')}
                        onClick={() => setFilters(true)}
                    >
                        <Icon name='filter_list' fill={filterActive ? 1 : 0} />
                        {filterActive && <span className='badge-dot' />}
                    </button>
                    <button type='button' className='icon-button' onClick={closeSearch}>
                        <Icon name='close' />
                    </button>
                </>
            ) : (
                <>
                    <h1 className='title'>{header.title}</h1>
                    {isEvents && (
                        <button
                            type='button'
                            className='icon-button'
                            onClick={() => setExpanded(true)}
                        >
                            <Icon name='search' />
                            {filterActive && <span className='badge-dot' />}
                        </button>
                    )}
                </>
            )}

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

            <Modal
                isOpen={filters}
                onClose={() => setFilters(false)}
                title={t('events.filtersTitle')}
            >
                {() => (
                    <div className='stack'>
                        <div className='choice-list'>
                            {EVENTS_FILTERS.map((filter) => (
                                <label key={filter}>
                                    <input
                                        type='radio'
                                        name='event-filter'
                                        checked={(search.get('filter') ?? 'All') === filter}
                                        onChange={() =>
                                            query({ filter: filter === 'All' ? null : filter })
                                        }
                                    />
                                    {t(FILTER_LABELS[filter])}
                                </label>
                            ))}
                            <hr />
                            {[false, true].map((compact) => (
                                <label key={String(compact)}>
                                    <input
                                        type='radio'
                                        name='event-view'
                                        checked={(search.get('compact') === '1') === compact}
                                        onChange={() => query({ compact: compact ? '1' : null })}
                                    />
                                    {t(compact ? 'events.compactView' : 'events.cardView')}
                                </label>
                            ))}
                        </div>
                        <Button
                            isBorderless
                            disabled={!filterActive}
                            onClick={() => query({ filter: null, compact: null })}
                        >
                            {t('events.filtersReset')}
                        </Button>
                    </div>
                )}
            </Modal>
        </header>
    )
}
