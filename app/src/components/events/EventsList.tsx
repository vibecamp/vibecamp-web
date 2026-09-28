'use client'

import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { Fragment, useMemo } from 'react'
import { t } from '@/copy/t'
import useHasAttendanceTicket from '@/hooks/useHasAttendanceTicket'
import { type DayjsEvent, useStore } from '@/hooks/useStore'
import dayjs from '@/lib/dayjs'
import { EVENTS_FILTERS, type EventsFilter } from '@/lib/hash-redirect'
import { eventPath, NEW_EVENT_PATH } from '@/lib/routes'
import { classNames } from '@/lib/ui'
import Icon from '../core/Icon'
import PageLoading from '../PageLoading'
import { usePageScroll } from '../PageScroll'
import EventCard from './Event'
import { filterEvents } from './filterEvents'

const isEventsFilter = (value: string | null): value is EventsFilter =>
    value != null && (EVENTS_FILTERS as readonly string[]).includes(value)

export default function EventsList() {
    const store = useStore()
    const searchParams = useSearchParams()
    const { scrollToTop, scrollTop } = usePageScroll()
    const showScrollButton = scrollTop > 200
    const hasTicket = useHasAttendanceTicket()

    const rawFilter = searchParams.get('filter')
    const filter: EventsFilter = isEventsFilter(rawFilter) ? rawFilter : 'All'
    const compact = searchParams.get('compact') === '1'
    const searchString = searchParams.get('q') ?? ''

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
        store.accountInfo.state.kind === 'loading' || store.allEvents.state.kind === 'loading'

    if (loading) return <PageLoading />
    if (store.accountInfo.state.kind === 'error') return <PageLoading error />

    return (
        <div className={classNames('page events-page', hasTicket && 'with-fab')}>
            <button
                type='button'
                className={classNames('scroll-to-top', !showScrollButton && 'hidden')}
                onClick={scrollToTop}
                tabIndex={showScrollButton ? 0 : -1}
            >
                <Icon name='arrow_back' />
                {t('events.scrollToTop')}
            </button>

            {visibleEvents.length === 0 ? (
                <p className='empty-state'>{t('events.noEvents')}</p>
            ) : compact ? (
                <CompactEvents events={visibleEvents} />
            ) : (
                <CardEvents events={visibleEvents} />
            )}

            {hasTicket && (
                <Link href={NEW_EVENT_PATH} className='fab'>
                    <Icon name='calendar_add_on' />
                </Link>
            )}
        </div>
    )
}

function CardEvents({ events }: { events: readonly DayjsEvent[] }) {
    const store = useStore()
    const festivals = store.festivals

    const festivalOf = (e: DayjsEvent) =>
        festivals?.find(
            (f) =>
                e.start_datetime.isAfter(f.start_date.startOf('day')) &&
                e.start_datetime.isBefore(f.end_date.endOf('day')),
        )

    return (
        <div className='events-grid'>
            {events.map((e, index) => {
                const festival = festivalOf(e)
                const previous = events[index - 1]
                const isFirst = festival !== (previous ? festivalOf(previous) : undefined)

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
                <Link href={eventPath(e.event_id)} key={e.event_id}>
                    <div className='time'>
                        {e.start_datetime.format(t('events.compactTimeFormat'))}
                    </div>
                    <div className='name'>{e.name}</div>
                </Link>
            ))}
        </div>
    )
}
