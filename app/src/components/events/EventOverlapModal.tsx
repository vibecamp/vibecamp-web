'use client'

import { t } from '@/copy/t'
import type { DayjsEvent } from '@/hooks/useStore'
import Button from '../core/Button'
import Icon from '../core/Icon'
import Modal from '../core/Modal'
import { formatEventLocation, formatEventTime } from './format'

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
                                    {formatEventLocation(event)}
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
