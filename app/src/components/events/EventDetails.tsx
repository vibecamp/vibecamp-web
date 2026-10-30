'use client'

import { useEffect } from 'react'
import { isFirstLoad } from '@/hooks/usePromise'
import { useStore } from '@/hooks/useStore'
import { eventPath, landingPath, SCHEDULE_PATH } from '@/lib/routes'
import { useNav } from '../NavStack'
import { usePageHeader } from '../PageHeader'
import PageLoading from '../PageLoading'
import { EventInfo, eventCardClassName } from './Event'

export default function EventDetails({ eventId }: { eventId: string }) {
    const store = useStore()
    const { replace } = useNav()
    const eventsState = store.allEvents.state
    const event = eventsState.result?.find((e) => e.event_id === eventId)

    usePageHeader(event ? { title: event.name } : null)

    const unknownEvent = eventsState.kind === 'result' && event == null
    useEffect(() => {
        if (unknownEvent) {
            replace(store.loggedIn ? SCHEDULE_PATH : landingPath(eventPath(eventId)))
        }
    }, [eventId, replace, store.loggedIn, unknownEvent])

    // bookmarks and account decide the bookmark icon and the edit button, so wait for them too
    if (
        event == null ||
        isFirstLoad(store.bookmarks.state) ||
        isFirstLoad(store.accountInfo.state)
    ) {
        return <PageLoading error={eventsState.kind === 'error'} />
    }

    return (
        <div className='page narrow'>
            <div className={eventCardClassName(event, 'detail')}>
                <EventInfo event={event} alreadyViewing />
            </div>
        </div>
    )
}
