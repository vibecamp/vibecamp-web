'use client'

import { useEffect, useState } from 'react'
import useHasAttendanceTicket from '@/hooks/useHasAttendanceTicket'
import { type DayjsEvent, useStore } from '@/hooks/useStore'
import { pathOf } from '@/lib/nav'
import { eventPath, SCHEDULE_PATH } from '@/lib/routes'
import { useNav } from '../NavStack'
import PageLoading from '../PageLoading'
import EventEditor from './EventEditor'

const isSettled = (kind: 'idle' | 'loading' | 'result' | 'error') =>
    kind === 'result' || kind === 'error'

export default function EventEditorPage({ eventId }: { eventId?: string }) {
    const store = useStore()
    const nav = useNav()
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
                ? SCHEDULE_PATH
                : undefined
            : resolved != null
              ? undefined
              : isSettled(eventsState.kind) && event == null
                ? SCHEDULE_PATH
                : event != null && isSettled(accountState.kind) && !isCreator
                  ? eventPath(eventId)
                  : undefined
    useEffect(() => {
        if (redirectTo != null) {
            nav.replace(redirectTo)
        }
    }, [redirectTo, nav.replace])

    const ready = resolved != null && (eventId == null ? hasTicket === true : true)
    if (!ready || resolved == null) {
        return <PageLoading error={eventsState.kind === 'error'} />
    }

    return (
        <div className='page narrow'>
            <EventEditor
                eventBeingEdited={resolved}
                onDone={() => nav.back()}
                onDeleted={() =>
                    nav.back({
                        skip: (url) =>
                            eventId != null && pathOf(url).startsWith(eventPath(eventId)),
                    })
                }
            />
        </div>
    )
}
