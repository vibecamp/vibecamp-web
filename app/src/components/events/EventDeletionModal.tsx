'use client'

import { fill } from '@/copy/fill'
import { t } from '@/copy/t'
import type { Tables } from '@/db/types'
import { usePromise } from '@/hooks/usePromise'
import { useStore } from '@/hooks/useStore'
import { vibefetch } from '@/lib/fetch'
import Button from '../core/Button'
import Modal from '../core/Modal'

type Props = {
    eventId: Tables['event']['event_id']
    eventName: string
    isOpen: boolean
    onClose: () => void
    onDone: () => void
}

export default function EventDeletionModal({ eventId, eventName, isOpen, onClose, onDone }: Props) {
    const store = useStore()

    const deleteEvent = usePromise(
        async () => {
            await vibefetch(store.jwt, '/event/delete', 'post', { event_id: eventId })
            await store.allEvents.load()
            onDone()
        },
        [eventId, onDone, store.allEvents, store.jwt],
        { lazy: true },
    )

    return (
        <Modal isOpen={isOpen} onClose={onClose}>
            {() => (
                <div className='stack'>
                    <p className='sheet-prompt'>
                        {fill(t('eventEditor.deletePrompt'), { eventName })}
                    </p>

                    <Button
                        isDanger
                        isPrimary
                        onClick={deleteEvent.load}
                        isLoading={deleteEvent.state.kind === 'loading'}
                    >
                        {t('eventEditor.deleteConfirm')}
                    </Button>

                    <Button onClick={onClose} disabled={deleteEvent.state.kind === 'loading'}>
                        {t('common.cancel')}
                    </Button>
                </div>
            )}
        </Modal>
    )
}
