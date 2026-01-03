import React from 'react'

import { DayjsEvent } from '../../hooks/useStore'
import Button from '../core/Button'
import Col from '../core/Col'
import Icon from '../core/Icon'
import Modal from '../core/Modal'
import Spacer from '../core/Spacer'
import { formatEventLocation, formatEventTime } from './Event'

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
                <Col align='stretch' justify='center' padding={20} pageLevel>
                    <div style={{ fontSize: 22, textAlign: 'center' }}>
                        This event overlaps with the following. Schedule it anyway?
                    </div>

                    <Spacer size={16} />

                    <div style={{ maxHeight: '40vh', overflowY: 'auto' }}>
                        {overlappingEvents.map((event, index) =>
                            <div className='card' style={{ marginTop: index > 0 ? 12 : undefined }} key={event.event_id}>
                                <div>
                                    {event.name}
                                </div>

                                <Spacer size={8} />

                                <div style={{ display: 'flex', alignItems: 'center' }}>
                                    <Icon name='schedule' style={{ fontSize: 18 }} />
                                    <Spacer size={6} />
                                    {formatEventTime(event)}
                                </div>

                                <Spacer size={8} />

                                <div style={{ display: 'flex', alignItems: 'center' }}>
                                    <Icon name='location_on' style={{ fontSize: 18 }} />
                                    <Spacer size={6} />
                                    {formatEventLocation(event)}
                                </div>
                            </div>
                        )}
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