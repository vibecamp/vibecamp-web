import React from 'react'

import { DayjsEvent } from '../../hooks/useStore'
import { doNothing } from '../../utils'
import Button from '../core/Button'
import Col from '../core/Col'
import Modal from '../core/Modal'
import Spacer from '../core/Spacer'
import CompactEvents from './CompactEvents'

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
                        {`This overlaps with the following event${overlappingEvents.length === 1 ? '' : 's'}. Want to schedule it anyway?`}
                    </div>

                    <Spacer size={16} />

                    <CompactEvents 
                        events={overlappingEvents}
                        editEvent={doNothing}
                    />

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