import { Suspense } from 'react'
import EventsList from '@/components/events/EventsList'

export default function EventsPage() {
    return (
        <Suspense fallback={null}>
            <EventsList />
        </Suspense>
    )
}
