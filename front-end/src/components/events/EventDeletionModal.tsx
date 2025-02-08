import React from 'react'

import { Tables } from '../../../../back-end/types/db-types'
import { usePromise } from '../../hooks/usePromise'
import { useStore } from '../../hooks/useStore'
import { vibefetch } from '../../vibefetch'
import Button from '../core/Button'
import Col from '../core/Col'
import Modal from '../core/Modal'
import Spacer from '../core/Spacer'

type Props = {
    eventId: Tables['event']['event_id'],
    eventName: string,
    isOpen: boolean,
    onClose: () => void,
    onDone: () => void
}

export default React.memo(({ eventId, eventName, isOpen, onClose, onDone }: Props) => {
    const store = useStore()

    const deleteEvent = usePromise(async () => {
        if (eventId != null) {
            await vibefetch(store.jwt, '/event/delete', 'post', { event_id: eventId })
            await store.allEvents.load()
            onDone()
        }
    }, [eventId, onDone, store.allEvents, store.jwt], { lazy: true })

    return (
        <Modal isOpen={isOpen} side='right'>
            {() => (
                <Col align='center' justify='center' padding={20} pageLevel>
                    <div style={{ fontSize: 22, textAlign: 'center' }}>
                        Are you sure you want to delete &quot;{eventName}&quot;?
                    </div>

                    <Spacer size={16} />

                    <Button isDanger isPrimary onClick={deleteEvent.load} isLoading={deleteEvent.state.kind === 'loading'}>
                        Yes, delete the event
                    </Button>

                    <Spacer size={8} />

                    <Button onClick={onClose} disabled={deleteEvent.state.kind === 'loading'}>
                        Cancel
                    </Button>
                </Col>
            )}
        </Modal>
    )
})