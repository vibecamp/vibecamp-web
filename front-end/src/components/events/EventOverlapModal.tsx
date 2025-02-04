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
                        This event overlaps with the following. Schedule it anyway?
                    </div>

                    <Spacer size={16} />

                    <table style={{ tableLayout: 'fixed', width: '100%', borderSpacing: 0 }}>
                        <thead>
                            <tr>
                                <th
                                    style={{
                                        padding: '5px 10px',
                                        width: '100px',
                                        textAlign: 'left',
                                    }}
                                >
                                    When
                                </th>
                                <th style={{ padding: '5px 10px', textAlign: 'left' }}>
                                    What
                                </th>
                                <th style={{ padding: '5px 10px', textAlign: 'left' }}>
                                    Where
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {overlappingEvents.map((event, index) => (
                                <tr
                                    key={event.event_id}
                                    style={{
                                        backgroundColor:
                                            index % 2 ? 'transparent' : 'rgba(0, 0, 0, 0.1)',
                                    }}
                                >
                                    <td
                                        style={{
                                            padding: '5px 10px',
                                            whiteSpace: 'nowrap',
                                            overflow: 'hidden',
                                            textOverflow: 'ellipsis',
                                            width: '100px',
                                        }}
                                    >
                                        {event.start_datetime.format('ddd h:mma')}
                                    </td>
                                    <td
                                        style={{
                                            padding: '5px 10px',
                                            whiteSpace: 'nowrap',
                                            overflow: 'hidden',
                                            textOverflow: 'ellipsis',
                                        }}
                                    >
                                        {event.name}
                                    </td>
                                    <td
                                        style={{
                                            padding: '5px 10px',
                                            whiteSpace: 'nowrap',
                                            overflow: 'hidden',
                                            textOverflow: 'ellipsis',
                                        }}
                                    >
                                        {event.event_site_location_name}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

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