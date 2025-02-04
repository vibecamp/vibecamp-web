import React from 'react'

import { DayjsEvent } from '../../hooks/useStore'
import Button from '../core/Button'
import Col from '../core/Col'
import Modal from '../core/Modal'
import Spacer from '../core/Spacer'

type Props = {
    isOpen: boolean,
    onClose: () => void,
    onConfirm: () => void,
    overlappingEvents: DayjsEvent[]
}

export default React.memo(({ isOpen, onClose, onConfirm, overlappingEvents }: Props) => {
    return (
        <Modal isOpen={isOpen} side='right'>
            {() => (
                <Col align='center' justify='center' padding={20} pageLevel>
                    <div style={{ fontSize: 22, textAlign: 'center' }}>
                        This event overlaps with:
                        {overlappingEvents.map(event => (
                            <div key={event.event_id} style={{ fontSize: 16, marginTop: 8 }}>
                                &quot;{event.name}&quot;
                                <br />
                                {event.start_datetime.format('MMM D, h:mm A')} -{' '}
                                {event.end_datetime?.format('h:mm A') ?? 'onwards'}
                                <br />
                                {event.event_site_location_name}
                            </div>
                        ))}
                        <br />
                        Want to schedule it anyway?
                    </div>

                    <Spacer size={16} />

                    <Button isPrimary onClick={onConfirm}>
                        Yes, schedule anyway
                    </Button>

                    <Spacer size={8} />

                    <Button onClick={onClose}>
                        Cancel
                    </Button>
                </Col>
            )}
        </Modal>
    )
})
