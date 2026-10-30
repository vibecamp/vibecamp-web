import type { LocationJson } from '@/contract/route-types'
import EventDescription from '../events/EventDescription'

export default function LocationFacts({ location }: { location: LocationJson }) {
    if (!location.description) return null
    return <EventDescription description={location.description} />
}
