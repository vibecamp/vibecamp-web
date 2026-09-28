'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import useHasAttendanceTicket from '@/hooks/useHasAttendanceTicket'
import { type DayjsEvent, useStore } from '@/hooks/useStore'
import { EVENTS_PATH, eventPath } from '@/lib/routes'
import PageLoading from '../PageLoading'
import EventEditor from './EventEditor'

const isSettled = (kind: 'idle' | 'loading' | 'result' | 'error') =>
    kind === 'result' || kind === 'error'

export default function EventEditorPage({ eventId }: { eventId?: string }) {
    const store = useStore()
    const router = useRouter()
    const hasTicket = useHasAttendanceTicket()
    const eventsState = store.allEvents.state
    const accountState = store.accountInfo.state

    const event =
        eventId != null ? eventsState.result?.find((e) => e.event_id === eventId) : undefined
    const isCreator =
        event != null && accountState.result?.account_id === event.created_by_account_id

    const [resolved, setResolved] = useState<DayjsEvent | 'new' | undefined>(
        eventId == null ? 'new' : undefined,
    )
    useEffect(() => {
        if (resolved == null && event != null && isCreator) {
            setResolved(event)
        }
    }, [event, isCreator, resolved])

    const redirectTo =
        eventId == null
            ? hasTicket === false
                ? EVENTS_PATH
                : undefined
            : resolved != null
              ? undefined
              : isSettled(eventsState.kind) && event == null
                ? EVENTS_PATH
                : event != null && isSettled(accountState.kind) && !isCreator
                  ? eventPath(eventId)
                  : undefined
    useEffect(() => {
        if (redirectTo != null) {
            router.replace(redirectTo)
        }
    }, [redirectTo, router])

    const backHref = eventId != null ? eventPath(eventId) : EVENTS_PATH

    const ready = resolved != null && (eventId == null ? hasTicket === true : true)
    if (!ready || resolved == null) {
        return <PageLoading error={eventsState.kind === 'error'} />
    }

    return (
        <div className='page narrow'>
            <EventEditor
                eventBeingEdited={resolved}
                onDone={() => router.push(backHref)}
                onDeleted={() => router.push(EVENTS_PATH)}
            />
        </div>
    )
}
