'use client'

import { t } from '@/copy/t'
import { type DayjsEvent, useStore } from '@/hooks/useStore'
import { isMapped } from '@/lib/locations'
import { locationPath } from '@/lib/routes'
import Button from '../core/Button'
import Icon from '../core/Icon'
import Modal from '../core/Modal'
import { formatEventTime } from './format'

type Props = {
    isOpen: boolean
    onClose: () => void
    onConfirm: () => void
    overlappingEvents: readonly DayjsEvent[]
}

export default function EventOverlapModal({
    isOpen,
    onClose,
    onConfirm,
    overlappingEvents,
}: Props) {
    const { locationsById } = useStore()
    const mapped = (locationId: string) => {
        const location = locationsById.get(locationId)
        return location != null && isMapped(location)
    }
    return (
        <Modal isOpen={isOpen} onClose={onClose}>
            {() => (
                <div className='stack'>
                    <p className='sheet-prompt'>{t('eventEditor.overlapPrompt')}</p>

                    <div className='overlap-list'>
                        {overlappingEvents.map((event) => (
                            <div className='card' key={event.event_id}>
                                <div>{event.name}</div>
                                <div>
                                    <Icon name='schedule' />
                                    {formatEventTime(event)}
                                </div>
                                <div>
                                    <Icon name='location_on' />
                                    {mapped(event.location_id) ? (
                                        // a new tab keeps the unsaved event form intact
                                        <a
                                            href={locationPath(event.location_id)}
                                            target='_blank'
                                            rel='noreferrer'
                                        >
                                            {event.location_name}
                                        </a>
                                    ) : (
                                        <span>{event.location_name}</span>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>

                    <Button isPrimary onClick={onConfirm}>
                        {t('eventEditor.overlapConfirm')}
                    </Button>

                    <Button onClick={onClose}>{t('common.cancel')}</Button>
                </div>
            )}
        </Modal>
    )
}
