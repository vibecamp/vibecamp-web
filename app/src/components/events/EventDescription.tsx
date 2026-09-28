import { urlsToLinks } from '@/lib/ui'

export default function EventDescription({ description }: { description: string }) {
    return <pre>{urlsToLinks(description)}</pre>
}
