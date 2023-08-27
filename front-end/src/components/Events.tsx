import React, { FC } from 'react'
import { observer } from 'mobx-react-lite'
import Store from '../Store'
import { EventData } from '../model'
import { given } from '../utils'
import Button from './core/Button'
import Input from './core/Input'
import Modal from './core/Modal'
import Spacer from './core/Spacer'


export default observer(() => {
    switch (Store.allEvents.state.kind) {
    case 'idle': return null
    case 'loading': return <>Loading...</>
    case 'result': return (
        <>
            <h1 style={{ justifyContent: 'space-between' }}>
                    Events
                <Button onClick={Store.newEvent}>
                        Create event
                    <Spacer size={8} />
                    <span className="material-symbols-outlined">calendar_add_on</span>
                </Button>
            </h1>

            {Store.allEvents.state.result.map(e =>
                <Event event={e} key={e.id} />)}

            <Modal isOpen={Store.eventBeingEdited != null} onClose={Store.stopEditingEvent}>
                {given(Store.eventBeingEdited, eventBeingEdited => (
                    <>

                        <Input
                            label='Event name'
                            value={eventBeingEdited.name}
                            onChange={val => eventBeingEdited.name = val}
                        />

                        <Spacer size={16} />

                        <Input
                            label='Event description'
                            value={eventBeingEdited.description}
                            onChange={val => eventBeingEdited.description = val}
                        />

                        <Spacer size={16} />

                        <Input
                            label='Start'
                            value={eventBeingEdited.start}
                            onChange={val => eventBeingEdited.start = val}
                        />

                        <Spacer size={16} />

                        <Input
                            label='End'
                            value={eventBeingEdited.end}
                            onChange={val => eventBeingEdited.end = val}
                        />

                        <Spacer size={16} />

                        <Input
                            label='Location name'
                            value={eventBeingEdited.locationName}
                            onChange={val => eventBeingEdited.locationName = val}
                        />

                        <Spacer size={16} />

                        <Input
                            label='Location address'
                            value={eventBeingEdited.locationAddress}
                            onChange={val => eventBeingEdited.locationAddress = val}
                        />

                        <Spacer size={16} />

                        <Button isSubmit isPrimary>
                                Create event
                        </Button>

                        <Spacer size={8} />

                        <Button onClick={Store.stopEditingEvent}>
                                Cancel
                        </Button>
                    </>
                ))}
            </Modal>
        </>
    )
    case 'error': return <>Error</>
    }
})

const Event: FC<{ event: EventData }> = observer(({ event }) => {
    const start = new Date(event.start)
    const end = new Date(event.end)

    return (
        <div className={'card' + ' ' + 'eventCard' + ' ' + (event.creator === 'Official' ? 'official' : '')}>
            <div className='eventName'>
                {event.name}

                {event.creator === Store.currentUser.username &&
                    <Button onClick={() => Store.editEvent(event.id)}>
                        Edit
                        <Spacer size={8} />
                        <span className="material-symbols-outlined">edit_calendar</span>
                    </Button>}

                <Button onClick={() => Store.currentUser.calendarEvents.push(event.id)}>
                    <span className="material-symbols-outlined">rsvp</span>
                </Button>
            </div>

            <Spacer size={8} />

            <div className='info'>
                <span className="material-symbols-outlined">schedule</span>
                {start.toTimeString()} - {end.toTimeString()}
            </div>

            <Spacer size={4} />

            <div className='info'>
                <span className="material-symbols-outlined">location_on</span>
                {event.locationName}
            </div>

            <Spacer size={4} />

            <div className='info'>
                <span className="material-symbols-outlined">person</span>
                <span className='eventCreator'>
                    {event.creator}
                </span>
            </div>

            <Spacer size={8} />

            <pre>
                {event.description}
            </pre>
        </div>
    )
})