import type { Metadata } from 'next'
import EventDetails from '@/components/events/EventDetails'
import { fill } from '@/copy/fill'
import { t } from '@/copy/t'
import { eventPath } from '@/lib/routes'
import { getEventForShare } from '@/server/events'

type Props = { params: Promise<{ eventId: string }> }

function truncate(s: string, max: number) {
    if (s.length <= max) return s
    return `${s.slice(0, max - 1).trimEnd()}…`
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { eventId } = await params
    const event = await getEventForShare(eventId)
    const title =
        event == null
            ? t('app.title')
            : event.event_type === 'UNOFFICIAL' && event.creator_name
              ? fill(t('share.hostedBy'), {
                    eventName: event.name,
                    creatorName: event.creator_name,
                })
              : event.name
    const description = event == null ? t('app.description') : truncate(event.description, 300)
    const image = { url: '/og-share.png', width: 1200, height: 630, alt: t('share.siteName') }
    return {
        title,
        description,
        openGraph: {
            siteName: t('share.siteName'),
            title,
            description,
            url: eventPath(eventId),
            type: 'website',
            images: [image],
        },
        twitter: { card: 'summary_large_image', title, description, images: [image] },
    }
}

export default async function EventPage({ params }: Props) {
    const { eventId } = await params
    return <EventDetails eventId={eventId} />
}
