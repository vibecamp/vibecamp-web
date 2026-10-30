'use client'

import { t } from '@/copy/t'
import { useStore } from '@/hooks/useStore'
import PageLoading from '../PageLoading'
import MapView from './MapView'

export default function MapPage() {
    const store = useStore()
    const { kind } = store.reference.state

    if (kind !== 'result') return <PageLoading error={kind === 'error'} />
    if (!store.map || !store.locations) {
        return (
            <div className='page centered'>
                <p className='empty-state'>{t('map.unavailable')}</p>
            </div>
        )
    }
    return (
        <div className='page map-page'>
            <MapView
                map={store.map}
                locations={store.locations}
                categories={store.locationCategories ?? []}
            />
        </div>
    )
}
