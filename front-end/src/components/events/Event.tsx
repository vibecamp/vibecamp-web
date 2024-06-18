import dayjs, { Dayjs } from 'dayjs'
import React, { useCallback, useMemo, useState } from 'react'

import { Routes } from '../../../../back-end/types/route-types'
import { usePromise } from '../../hooks/usePromise'
import { useStore } from '../../hooks/useStore'
import { vibefetch } from '../../vibefetch'
import Button from '../core/Button'
import Icon from '../core/Icon'
import Spacer from '../core/Spacer'
import EventDescription from './EventDescription'

type Props = {
    event: Omit<Routes['/events']['response']['events'][number], 'start_datetime' | 'end_datetime'> & {
        start_datetime: Dayjs,
        end_datetime: Dayjs | null
    },
    editEvent: (eventId: string) => void,
    firstOfFestival?: boolean,
    duringFestival?: string,
}

export default React.memo(({ event, editEvent, firstOfFestival, duringFestival }: Props) => {
    const store = useStore()

    const [bookmarkStatusOptimistic, setBookmarkStatusOptimistic] = useState<boolean | null>(null)
    const bookmarked = bookmarkStatusOptimistic ?? store.bookmarks.state.result?.event_ids.includes(event.event_id)
    const when = useMemo(() => {
        const now = dayjs.utc()
        const timeOnly = 'h:mma'
        const dateAndTime = (d: Dayjs) => (
            now.isSame(d, 'year')
                ? 'ddd, M/D [at] ' + timeOnly
                : 'ddd, M/D/YYYY [at] ' + timeOnly
        )

        if (event.end_datetime == null) {
            return event.start_datetime.format(dateAndTime(event.start_datetime))
        } else if (event.end_datetime.isSame(event.start_datetime, 'day')) {
            return event.start_datetime.format(dateAndTime(event.start_datetime)) + ' - ' + event.end_datetime.format(timeOnly)
        } else {
            return event.start_datetime.format(dateAndTime(event.start_datetime)) + ' - ' + event.end_datetime.format(dateAndTime(event.end_datetime))
        }
    }, [event.end_datetime, event.start_datetime])

    const unbookmarkEvent = usePromise(async () => {
        await vibefetch(store.jwt, '/event/unbookmark', 'post', { event_id: event.event_id })
        await store.bookmarks.load()
    }, [event.event_id, store.bookmarks, store.jwt], { lazy: true })

    const bookmarkEvent = usePromise(async () => {
        await vibefetch(store.jwt, '/event/bookmark', 'post', { event_id: event.event_id })
        await store.bookmarks.load()
    }, [event.event_id, store.bookmarks, store.jwt], { lazy: true })

    const toggleBookmark = useCallback(async () => {
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
    }, [bookmarkEvent, bookmarked, unbookmarkEvent])

    const handleEditButtonClick = useCallback(() => editEvent(event.event_id), [editEvent, event.event_id])

    const eventCreatorLabel = (
        event.event_type === 'TEAM_OFFICIAL' ? 'Vibecamp team' :
            event.event_type === 'CAMPSITE_OFFICIAL' ? 'Campsite' :
                event.creator_name
    )

    return (
        <div className={'eventCardWrapper' + ' ' + (duringFestival ? 'duringFestival' : '') + ' ' + (firstOfFestival ? 'firstOfFestival' : '')}>
            {firstOfFestival &&
                <div className='festivalStart'>
                    {duringFestival}
                </div>}

            <div className={'card' + ' ' + 'eventCard' + ' ' + (event.created_by_account_id === '-1' ? 'official' : '') + ' ' + event.event_type}>
                <div className='eventName'>
                    <div>{event.name}</div>

                    <div style={{ flexGrow: 1, flexShrink: 1 }}></div>

                    {event.created_by_account_id === store.accountInfo.state.result?.account_id &&
                    <Button onClick={handleEditButtonClick} isCompact style={{ width: 'auto' }}>
                        Edit

                        <Spacer size={8} />

                        <Icon name='edit_calendar' style={{ fontSize: '1em' }} />
                    </Button>}

                    <Spacer size={8} />

                    <Button onClick={toggleBookmark} isCompact style={{ width: 'auto' }}>
                        <Icon name='star' fill={bookmarked ? 1 : 0} style={{ fontSize: '1em' }} />
                    </Button>
                </div>

                <Spacer size={8} />

                {eventCreatorLabel &&
                <>
                    <div className='info host' title='Host'>
                        <Icon name='person' />
                        <span className='eventCreator'>
                            {eventCreatorLabel}
                        </span>
                    </div>

                    <Spacer size={4} />
                </>}

                <div className='info'>
                    <Icon name='schedule' />
                    <span>
                        {when}
                    </span>
                </div>

                <Spacer size={4} />

                <div className='info'>
                    <Icon name='location_on' />
                    <span>
                        {event.plaintext_location || event.event_site_location_name}
                    </span>
                </div>

                <Spacer size={4} />

                <div className='info' title='Bookmarked by'>
                    <Icon name='star'/>
                    <span>
                        {event.bookmarks}
                    </span>
                </div>

                <Spacer size={8} />

                <EventDescription description={event.description} />
            </div>
        </div>
    )
})