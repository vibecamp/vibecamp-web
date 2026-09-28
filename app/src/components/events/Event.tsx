'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { t } from '@/copy/t'
import { usePromise } from '@/hooks/usePromise'
import { type DayjsEvent, useStore } from '@/hooks/useStore'
import { vibefetch } from '@/lib/fetch'
import { editEventPath, eventPath } from '@/lib/routes'
import { classNames } from '@/lib/ui'
import Icon from '../core/Icon'
import { useToast } from '../Toast'
import EventDescription from './EventDescription'
import { formatEventLocation, formatEventTime } from './format'

export const eventCardClassName = (event: DayjsEvent, extra?: string | false) =>
    classNames('event-card', event.event_type === 'TEAM_OFFICIAL' && 'TEAM_OFFICIAL', extra)

export default function EventCard({ event }: { event: DayjsEvent }) {
    const router = useRouter()
    return (
        // biome-ignore lint/a11y/useKeyWithClickEvents: the card is a pointer shortcut; the actions inside are real buttons
        // biome-ignore lint/a11y/noStaticElementInteractions: same
        <div
            className={eventCardClassName(event)}
            onClick={() => router.push(eventPath(event.event_id))}
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
    const router = useRouter()
    const toast = useToast()

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
    const location = formatEventLocation(event)

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
                                router.push(editEventPath(event.event_id))
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

                {location && (
                    <div className='info'>
                        <Icon name='location_on' />
                        <span>{location}</span>
                    </div>
                )}

                <div className='info'>
                    <Icon name='bookmark' />
                    <span>{event.bookmarks}</span>
                </div>
            </div>

            <EventDescription description={event.description} />
        </div>
    )
}
