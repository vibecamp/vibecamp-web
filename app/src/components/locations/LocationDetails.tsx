'use client'

import { useEffect } from 'react'
import { fill } from '@/copy/fill'
import { t } from '@/copy/t'
import { isFirstLoad } from '@/hooks/usePromise'
import { useStore } from '@/hooks/useStore'
import dayjs from '@/lib/dayjs'
import { isMapped } from '@/lib/locations'
import { imagePath, MAP_PATH } from '@/lib/routes'
import { festivalOf } from '@/lib/rules'
import FadeInImage from '../core/FadeInImage'
import EventCard from '../events/Event'
import EventDescription from '../events/EventDescription'
import MapInset from '../map/MapInset'
import { useNav } from '../NavStack'
import { usePageHeader } from '../PageHeader'
import PageLoading from '../PageLoading'
import MapAppLinks from './MapAppLinks'

export default function LocationDetails({ locationId }: { locationId: string }) {
    const store = useStore()
    const { replace } = useNav()
    const location = store.locationsById.get(locationId)
    const { kind } = store.reference.state
    usePageHeader(location ? { title: location.name } : null)

    const unknown = kind === 'result' && (location == null || !isMapped(location))
    useEffect(() => {
        if (unknown) replace(MAP_PATH)
    }, [replace, unknown])

    if (location == null || !isMapped(location)) return <PageLoading error={kind === 'error'} />

    const festivals = store.festivals
    const festival =
        festivals?.find((f) => !f.end_date.isBefore(dayjs.utc(), 'day')) ?? festivals?.at(-1)
    const now = dayjs()
    const events = (store.allEvents.state.result ?? []).filter(
        (e) =>
            e.location_id === location.location_id &&
            festival != null &&
            festivalOf(e.start_datetime, [festival]) === festival,
    )
    const ended = (e: (typeof events)[number]) => (e.end_datetime ?? e.start_datetime).isBefore(now)
    const upcoming = events.filter((e) => !ended(e))
    const past = events.filter(ended).reverse()
    const eventsReady = !isFirstLoad(store.allEvents.state) && !isFirstLoad(store.bookmarks.state)

    return (
        <div className='page narrow location-page'>
            <MapInset location={location} />

            <div className='location-title'>
                <h1>
                    {location.name}
                    {location.aka && ' '}
                    {location.aka && (
                        <span className='location-aka'>
                            {fill(t('location.aka'), { name: location.aka })}
                        </span>
                    )}
                </h1>
                {location.deleted_at && <p className='notice'>{t('location.unavailable')}</p>}
            </div>

            {location.latitude != null && location.longitude != null && (
                <MapAppLinks
                    name={location.name}
                    latitude={location.latitude}
                    longitude={location.longitude}
                />
            )}

            {location.description && (
                <div className='location-description'>
                    <EventDescription description={location.description} />
                </div>
            )}

            {location.images.length > 0 && (
                <div className='location-photos'>
                    {location.images.map((image) => (
                        <figure key={image.image_id} className='media-frame'>
                            <FadeInImage
                                src={imagePath(image.image_id)}
                                width={image.width}
                                height={image.height}
                                alt={location.name}
                                loading='lazy'
                            />
                        </figure>
                    ))}
                </div>
            )}

            {eventsReady && upcoming.length > 0 && (
                <section className='location-events'>
                    <div className='section-heading'>
                        <h2>{t('location.upcomingEvents')}</h2>
                    </div>
                    {upcoming.map((e) => (
                        <EventCard key={e.event_id} event={e} />
                    ))}
                </section>
            )}

            {eventsReady && past.length > 0 && (
                <section className='location-events'>
                    <div className='section-heading'>
                        <h2>{t('location.pastEvents')}</h2>
                    </div>
                    {past.map((e) => (
                        <EventCard key={e.event_id} event={e} />
                    ))}
                </section>
            )}
        </div>
    )
}
