'use client'

import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { Fragment, useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { t } from '@/copy/t'
import useHasAttendanceTicket from '@/hooks/useHasAttendanceTicket'
import { isFirstLoad } from '@/hooks/usePromise'
import { type DayjsEvent, useStore } from '@/hooks/useStore'
import dayjs from '@/lib/dayjs'
import { EVENTS_FILTERS, type EventsFilter } from '@/lib/hash-redirect'
import { eventPath, NEW_EVENT_PATH, SCHEDULE_PATH } from '@/lib/routes'
import { festivalOf } from '@/lib/rules'
import { classNames } from '@/lib/ui'
import Button from '../core/Button'
import Icon from '../core/Icon'
import Modal from '../core/Modal'
import SearchField from '../core/SearchField'
import { useMembersOnly } from '../LoginPrompt'
import { useNav } from '../NavStack'
import { type HeaderSearch, usePageHeader } from '../PageHeader'
import PageLoading from '../PageLoading'
import { usePageScroll } from '../PageScroll'
import { useToast } from '../Toast'
import EventCard from './Event'
import { filterEvents } from './filterEvents'

const isEventsFilter = (value: string | null): value is EventsFilter =>
    value != null && (EVENTS_FILTERS as readonly string[]).includes(value)

const FILTER_LABELS = {
    All: 'events.filterAll',
    Bookmarks: 'events.filterBookmarks',
    Mine: 'events.filterMine',
    Past: 'events.filterPast',
} as const satisfies Record<EventsFilter, string>

const MEMBER_FILTERS: readonly EventsFilter[] = ['Bookmarks', 'Mine']

export default function EventsList() {
    const store = useStore()
    const searchParams = useSearchParams()
    const { scrollToTop, scrollTop } = usePageScroll()
    const showScrollButton = scrollTop > 200
    const hasTicket = useHasAttendanceTicket()
    const membersOnly = useMembersOnly()
    const toast = useToast()

    const rawFilter = searchParams.get('filter')
    const filter: EventsFilter = isEventsFilter(rawFilter) ? rawFilter : 'All'
    const compact = searchParams.get('compact') === '1'
    const filterActive = filter !== 'All' || compact

    const { replace, screenKey, getScreenState, setScreenState } = useNav()
    // typed text lives here rather than in the URL: a navigation per keystroke can't keep up with fast typing
    const [searchString, setSearchString] = useState(
        () => (screenKey && getScreenState(screenKey)?.searchText) ?? searchParams.get('q') ?? '',
    )
    const changeSearch = useCallback(
        (text: string) => {
            setSearchString(text)
            if (screenKey) setScreenState(screenKey, { searchText: text })
        },
        [screenKey, setScreenState],
    )
    const query = useCallback(
        (changes: Record<string, string | null>) => {
            const params = new URLSearchParams(searchParams.toString())
            for (const [key, value] of Object.entries(changes)) {
                if (value) params.set(key, value)
                else params.delete(key)
            }
            replace(`${SCHEDULE_PATH}${params.size ? `?${params}` : ''}`)
        },
        [replace, searchParams],
    )

    const [filtersOpen, setFiltersOpen] = useState(false)
    const [searchInTopBar, setSearchInTopBar] = useState(false)
    const search = useMemo(
        (): HeaderSearch => ({
            value: searchString,
            onChange: changeSearch,
            placeholder: t('events.searchPlaceholder'),
            inTopBar: searchInTopBar,
            filter: {
                active: filterActive,
                label: t('events.filter'),
                onClick: () => setFiltersOpen(true),
            },
        }),
        [changeSearch, filterActive, searchInTopBar, searchString],
    )
    usePageHeader({ search })

    // an old link's ?q= only seeds the search box, then leaves the URL so a reload can't bring back stale text
    const seededFromUrl = useRef(searchParams.has('q'))
    useEffect(() => {
        if (!seededFromUrl.current) return
        seededFromUrl.current = false
        changeSearch(searchString)
        query({ q: null })
    }, [changeSearch, query, searchString])

    const allEvents = store.allEvents.state.result
    const bookmarkedEventIds = store.bookmarks.state.result?.event_ids
    const accountId = store.jwtPayload?.account_id
    const visibleEvents = useMemo(
        () =>
            filterEvents(allEvents ?? [], {
                filter,
                searchString,
                bookmarkedEventIds,
                accountId,
                now: dayjs(),
            }),
        [accountId, allEvents, bookmarkedEventIds, filter, searchString],
    )

    const loading =
        isFirstLoad(store.accountInfo.state) ||
        isFirstLoad(store.allEvents.state) ||
        isFirstLoad(store.bookmarks.state)

    const searchRef = useRef<HTMLDivElement>(null)
    // judged from the scroll position being restored, so the first frame shows the right header
    useLayoutEffect(() => {
        const el = searchRef.current
        const root = el?.closest('.page-scroll')
        if (loading || !el || !root || !screenKey) return
        const restoring = getScreenState(screenKey)?.scrollTop ?? 0
        const box = el.getBoundingClientRect()
        const top = box.top - root.getBoundingClientRect().top + root.scrollTop
        setSearchInTopBar(restoring > top + box.height / 2)
    }, [getScreenState, loading, screenKey])
    useEffect(() => {
        const el = searchRef.current
        if (loading || !el) return
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (!entry) return
                const above = entry.boundingClientRect.top < (entry.rootBounds?.top ?? 0)
                setSearchInTopBar(above && entry.intersectionRatio < 0.5)
            },
            { root: el.closest('.page-scroll'), threshold: [0, 0.5, 1] },
        )
        observer.observe(el)
        return () => {
            observer.disconnect()
            setSearchInTopBar(false)
        }
    }, [loading])

    if (loading) return <PageLoading />
    if (store.accountInfo.state.kind === 'error') return <PageLoading error />

    return (
        <>
            <div className='page events-page with-fab'>
                <button
                    type='button'
                    className={classNames('scroll-to-top', !showScrollButton && 'hidden')}
                    onClick={scrollToTop}
                    tabIndex={showScrollButton ? 0 : -1}
                >
                    <Icon name='arrow_back' />
                    {t('events.scrollToTop')}
                </button>

                <div
                    ref={searchRef}
                    className={classNames('page-search', searchInTopBar && 'away')}
                >
                    <SearchField search={search} hidden={searchInTopBar} />
                </div>

                {visibleEvents.length === 0 ? (
                    <p className='empty-state'>{t('events.noEvents')}</p>
                ) : compact ? (
                    <CompactEvents events={visibleEvents} />
                ) : (
                    <CardEvents events={visibleEvents} />
                )}
            </div>

            <Link
                href={NEW_EVENT_PATH}
                className='fab'
                aria-label={t('events.newEvent')}
                onClick={(e) => {
                    if (membersOnly(NEW_EVENT_PATH)) {
                        e.preventDefault()
                    } else if (hasTicket === false) {
                        e.preventDefault()
                        toast(t('events.ticketRequiredToCreate'))
                    }
                }}
            >
                <Icon name='calendar_add_on' />
            </Link>

            <Modal
                isOpen={filtersOpen}
                onClose={() => setFiltersOpen(false)}
                title={t('events.filtersTitle')}
            >
                {() => (
                    <div className='stack'>
                        <div className='choice-list'>
                            {EVENTS_FILTERS.map((option) => (
                                <label key={option}>
                                    <input
                                        type='radio'
                                        name='event-filter'
                                        checked={filter === option}
                                        onChange={() => {
                                            if (MEMBER_FILTERS.includes(option) && membersOnly()) {
                                                setFiltersOpen(false)
                                                return
                                            }
                                            query({ filter: option === 'All' ? null : option })
                                        }}
                                    />
                                    {t(FILTER_LABELS[option])}
                                </label>
                            ))}
                            <hr />
                            {[false, true].map((option) => (
                                <label key={String(option)}>
                                    <input
                                        type='radio'
                                        name='event-view'
                                        checked={compact === option}
                                        onChange={() => query({ compact: option ? '1' : null })}
                                    />
                                    {t(option ? 'events.compactView' : 'events.cardView')}
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
        </>
    )
}

function CardEvents({ events }: { events: readonly DayjsEvent[] }) {
    const store = useStore()
    const festivals = store.festivals

    return (
        <div className='events-grid'>
            {events.map((e, index) => {
                const festival = festivalOf(e.start_datetime, festivals)
                const previous = events[index - 1]
                const isFirst =
                    festival !==
                    (previous ? festivalOf(previous.start_datetime, festivals) : undefined)

                return (
                    <Fragment key={e.event_id}>
                        {isFirst && festival && (
                            <div className='festival-start'>{festival.festival_name}</div>
                        )}
                        <EventCard event={e} />
                    </Fragment>
                )
            })}
        </div>
    )
}

function CompactEvents({ events }: { events: readonly DayjsEvent[] }) {
    return (
        <div className='compact-events'>
            <div className='headings'>
                <div className='time'>{t('events.compactWhenHeading')}</div>
                <div className='name'>{t('events.compactWhatHeading')}</div>
            </div>
            {events.map((e) => (
                <Link href={eventPath(e.event_id)} key={e.event_id} prefetch>
                    <div className='time'>
                        {e.start_datetime.format(t('events.compactTimeFormat'))}
                    </div>
                    <div className='name'>{e.name}</div>
                </Link>
            ))}
        </div>
    )
}
