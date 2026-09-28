'use client'

import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { useStore } from '@/hooks/useStore'
import { EVENTS_PATH } from '@/lib/routes'
import { usePageHeader } from '../PageHeader'
import PageLoading from '../PageLoading'
import { EventInfo, eventCardClassName } from './Event'

export default function EventDetails({ eventId }: { eventId: string }) {
    const store = useStore()
    const router = useRouter()
    const eventsState = store.allEvents.state
    const event = eventsState.result?.find((e) => e.event_id === eventId)

    usePageHeader(event ? { title: event.name, back: EVENTS_PATH } : null)

    const unknownEvent = eventsState.kind === 'result' && event == null
    useEffect(() => {
        if (unknownEvent) {
            router.replace(EVENTS_PATH)
        }
    }, [router, unknownEvent])

    if (event == null) {
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
