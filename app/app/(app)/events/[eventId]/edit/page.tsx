import EventEditorPage from '@/components/events/EventEditorPage'

type Props = { params: Promise<{ eventId: string }> }

export default async function EditEventPage({ params }: Props) {
    const { eventId } = await params
    return <EventEditorPage eventId={eventId} />
}
