'use client'

import Link from 'next/link'
import { useRef, useState } from 'react'
import { t } from '@/copy/t'
import usePrefetchWhenVisible from '@/hooks/usePrefetchWhenVisible'
import { usePromise } from '@/hooks/usePromise'
import { type DayjsEvent, useStore } from '@/hooks/useStore'
import { vibefetch } from '@/lib/fetch'
import { isMapped } from '@/lib/locations'
import { editEventPath, eventPath, locationPath } from '@/lib/routes'
import { classNames } from '@/lib/ui'
import Icon from '../core/Icon'
import { useMembersOnly } from '../LoginPrompt'
import MapInset from '../map/MapInset'
import { useNav } from '../NavStack'
import { useToast } from '../Toast'
import EventDescription from './EventDescription'
import { formatEventTime } from './format'

export const eventCardClassName = (event: DayjsEvent, extra?: string | false) =>
    classNames('event-card', event.event_type === 'TEAM_OFFICIAL' && 'TEAM_OFFICIAL', extra)

export default function EventCard({ event }: { event: DayjsEvent }) {
    const nav = useNav()
    const ref = useRef<HTMLDivElement>(null)
    usePrefetchWhenVisible(ref, eventPath(event.event_id))
    return (
        // biome-ignore lint/a11y/useKeyWithClickEvents: the card is a pointer shortcut; the actions inside are real buttons
        // biome-ignore lint/a11y/noStaticElementInteractions: same
        <div
            ref={ref}
            className={eventCardClassName(event)}
            onClick={() => nav.push(eventPath(event.event_id))}
        >
            <EventInfo event={event} />
        </div>
    )
}

export function EventInfo({
    event,
    alreadyViewing,
}: {
    event: DayjsEvent
    alreadyViewing?: boolean
}) {
    const store = useStore()
    const nav = useNav()
    const toast = useToast()
    const membersOnly = useMembersOnly()

    const [bookmarkStatusOptimistic, setBookmarkStatusOptimistic] = useState<boolean | null>(null)
    const bookmarked =
        bookmarkStatusOptimistic ??
        store.bookmarks.state.result?.event_ids.includes(event.event_id) ??
        false

    const unbookmarkEvent = usePromise(
        async () => {
            await vibefetch(store.jwt, '/event/unbookmark', 'post', { event_id: event.event_id })
            await store.bookmarks.load()
        },
        [event.event_id, store.bookmarks, store.jwt],
        { lazy: true },
    )

    const bookmarkEvent = usePromise(
        async () => {
            await vibefetch(store.jwt, '/event/bookmark', 'post', { event_id: event.event_id })
            await store.bookmarks.load()
        },
        [event.event_id, store.bookmarks, store.jwt],
        { lazy: true },
    )

    async function toggleBookmark() {
        try {
            if (bookmarked) {
                setBookmarkStatusOptimistic(false)
                await unbookmarkEvent.load()
            } else {
                setBookmarkStatusOptimistic(true)
                await bookmarkEvent.load()
            }
        } finally {
            setBookmarkStatusOptimistic(null)
        }
    }

    async function share() {
        const url = `${window.location.origin}${eventPath(event.event_id)}`
        try {
            await navigator.clipboard.writeText(url)
            toast(t('events.linkCopied'))
        } catch (err) {
            console.error(err)
        }
    }

    const eventCreatorLabel =
        event.event_type === 'TEAM_OFFICIAL' ? t('events.vibecampTeam') : event.creator_name

    const isCreator = event.created_by_account_id === store.accountInfo.state.result?.account_id
    const location = store.locationsById.get(event.location_id)
    const place = alreadyViewing ? location : undefined

    return (
        <div className='event-info'>
            <div className='event-name'>
                {alreadyViewing ? (
                    <h2 className='name-text'>{event.name}</h2>
                ) : (
                    <span className='name-text'>{event.name}</span>
                )}

                <div className='event-actions'>
                    {isCreator && (
                        <button
                            type='button'
                            className='icon-button'
                            onClick={(e) => {
                                e.stopPropagation()
                                nav.push(editEventPath(event.event_id))
                            }}
                        >
                            <Icon name='edit_calendar' />
                        </button>
                    )}
                    <button
                        type='button'
                        className={classNames('icon-button', bookmarked && 'active')}
                        onClick={(e) => {
                            e.stopPropagation()
                            if (membersOnly()) return
                            void toggleBookmark()
                        }}
                    >
                        <Icon name='bookmark' fill={bookmarked ? 1 : 0} />
                    </button>
                    <button
                        type='button'
                        className='icon-button'
                        onClick={(e) => {
                            e.stopPropagation()
                            void share()
                        }}
                    >
                        <Icon name='share' />
                    </button>
                </div>
            </div>

            <div className='event-meta'>
                {eventCreatorLabel && (
                    <div className='info host'>
                        <Icon name='person' />
                        <span className='event-creator'>{eventCreatorLabel}</span>
                    </div>
                )}

                <div className='info'>
                    <Icon name='schedule' />
                    <span>{formatEventTime(event)}</span>
                </div>

                <div className='info'>
                    <Icon name='location_on' />
                    {alreadyViewing && location && isMapped(location) ? (
                        <Link href={locationPath(event.location_id)} prefetch>
                            {event.location_name}
                        </Link>
                    ) : (
                        <span>{event.location_name}</span>
                    )}
                </div>

                <div className='info'>
                    <Icon name='bookmark' />
                    <span>{event.bookmarks}</span>
                </div>
            </div>

            {place && <MapInset location={place} href={locationPath(place.location_id)} />}

            <EventDescription description={event.description} />
        </div>
    )
}
