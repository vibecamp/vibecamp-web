import React, { useMemo } from 'react'

import useHashState from '../../hooks/useHashState'
import { DayjsEvent } from '../../hooks/useStore'
import Modal from '../core/Modal'
import { EventInfo } from './Event'

export default React.memo(({ events, editEvent }: { events: readonly DayjsEvent[], editEvent: (eventId: string) => void }) => {
    const { hashState, setHashState, getHashStateString } = useHashState()

    const viewingEvent = useMemo(() => events.find(e => e.event_id === hashState?.viewingEventDetails), [events, hashState?.viewingEventDetails])

    return (
        <>
            <div className='compactEvents'>
                <a className='headings'>
                    <div className='time'>When</div>
                    <div className='name'>What</div>
                </a>
                {events.map(e => {
                    return (
                        <a
                            href={'#' + getHashStateString({ viewingEventDetails: e.event_id })}
                            key={e.event_id}
                        >
                            <div className='time'>{e.start_datetime.format('ddd h:mma')}</div>
                            <div className='name'>{e.name}</div>
                        </a>
                    )
                })}
            </div>

            <Modal isOpen={viewingEvent != null} onClose={() => setHashState({ viewingEventDetails: undefined })} side='right'>
                {() =>
                    viewingEvent &&
                        <div style={{ padding: 20 }}>
                            <EventInfo event={viewingEvent} editEvent={editEvent} />
                        </div>}
            </Modal>
        </>
    )
})
