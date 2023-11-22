import React, { FC } from 'react'
import { observer } from 'mobx-react-lite'
import Store from '../Store'
import { EventData } from '../model'
import { given } from '../utils'
import Button from './core/Button'
import Input from './core/Input'
import Modal from './core/Modal'
import Spacer from './core/Spacer'
import Icon from './core/Icon'


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
                    <Icon name='calendar_add_on' />
                </Button>
            </h1>

            {Store.allEvents.state.result.map(e =>
                <Event event={e} key={e.id} />)}

            <Modal isOpen={Store.eventBeingEdited != null} onClose={Store.stopEditingEvent}>
                {() => given(Store.eventBeingEdited, eventBeingEdited => (
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
        <div className={'card' + ' ' + 'eventCard' + ' ' + (event.creator === '-1' ? 'official' : '')}>
            <div className='eventName'>
                {event.name}

                {event.creator === Store.accountInfo.state.result?.account_id &&
                    <Button onClick={() => Store.editEvent(event.id)}>
                        Edit
                        <Spacer size={8} />
                        <Icon name='edit_calendar' />
                    </Button>}

                {/* onClick={() => Store.currentUser.calendarEvents.push(event.id)} */}
                <Button>
                    <Icon name='rsvp' />
                </Button>
            </div>

            <Spacer size={8} />

            <div className='info'>
                <Icon name='schedule' />
                {start.toTimeString()} - {end.toTimeString()}
            </div>

            <Spacer size={4} />

            <div className='info'>
                <Icon name='location_on' />
                {event.locationName}
            </div>

            <Spacer size={4} />

            <div className='info'>
                <Icon name='person' />
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