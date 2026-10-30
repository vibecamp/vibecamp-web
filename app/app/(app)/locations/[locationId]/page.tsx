import LocationDetails from '@/components/locations/LocationDetails'

type Props = { params: Promise<{ locationId: string }> }

export default async function LocationPage({ params }: Props) {
    const { locationId } = await params
    return <LocationDetails locationId={locationId} />
}
