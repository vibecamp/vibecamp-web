import { useLocalObservable } from 'mobx-react-lite'
import React, { FC } from 'react'

import { Tables } from '../../../back-end/types/db-types'
import { fieldToProps,Form, form, FormValidators } from '../mobx/form'
import { useRequest, useStable } from '../mobx/hooks'
import { observer } from '../mobx/misc'
import Store from '../stores/Store'
import { preventingDefault } from '../utils'
import { vibefetch } from '../vibefetch'
import Button from './core/Button'
import Col from './core/Col'
import DateField from './core/DateField'
import Icon from './core/Icon'
import Input from './core/Input'
import LoadingDots from './core/LoadingDots'
import Modal from './core/Modal'
import Row from './core/Row'
import Spacer from './core/Spacer'

type InProgressEvent = {
    event_id: string | null,
    name: string,
    description: string,
    start_datetime: Date | null,
    end_datetime: Date | null,
    location: string | null
}

export default observer(() => {
    const state = useLocalObservable(() => ({
        eventBeingEdited: null as Form<InProgressEvent> | null
    }))

    const eventValidators: FormValidators<InProgressEvent> = {
        name: val => {
            if (val === '') {
                return 'Please enter a name for the event'
            }
        },
        start_datetime: val => {
            if (val == null) {
                return 'Please select a start date/time'
            }
        },
        end_datetime: val => {
            const start = state.eventBeingEdited?.fields.start_datetime.value
            if (start != null && val != null && start >= val) {
                return 'End date/time is before start date/time'
            }
        }
    }

    const createNewEvent = useStable(() => () => {
        state.eventBeingEdited = form<InProgressEvent>({
            initialValues: {
                event_id: null,
                name: '',
                description: '',
                start_datetime: null,
                end_datetime: null,
                location: null
            },
            validators: eventValidators
        })
    })

    const editEvent = useStable(() => (eventId: string) => {
        const existing = Store.allEvents.state.result?.find(e => e.event_id === eventId)

        if (existing) {
            state.eventBeingEdited = form<InProgressEvent>({
                initialValues: {
                    event_id: existing.event_id,
                    name: existing.name,
                    description: existing.description,
                    start_datetime: existing.start_datetime,
                    end_datetime: existing.end_datetime,
                    location: existing.location
                },
                validators: eventValidators
            })
        }
    })

    const saveEvent = useRequest(async () => {
        if (state.eventBeingEdited == null || !state.eventBeingEdited.isValid) {
            state.eventBeingEdited?.activateAllValidation()
            return
        }

        const { event_id, name, description, start_datetime, end_datetime, location } = state.eventBeingEdited.fieldValues

        await vibefetch(Store.jwt, '/event/save', 'post', {
            event: {
                event_id,
                name,
                description,
                start_datetime: start_datetime!.toISOString(),
                end_datetime: end_datetime?.toISOString() ?? null,
                location
            }
        })
        await Store.allEvents.load()
        stopEditingEvent()
    }, { lazy: true })

    const stopEditingEvent = useStable(() => () => {
        state.eventBeingEdited = null
    })

    return (
        Store.allEvents.state.kind === 'loading' || Store.bookmarks.state.kind === 'loading'
            ? <LoadingDots size={60} color='var(--color-accent-1)' />
            : <Col padding={20} pageLevel>
                <Row justify='space-between'>
                    <h1 style={{ fontSize: 24 }}>
                        Events
                    </h1>

                    <Button onClick={createNewEvent} style={{ width: 'auto' }}>
                        Create event

                        <Spacer size={8} />

                        <Icon name='calendar_add_on' />
                    </Button>
                </Row>

                {Store.allEvents.state.result?.map(e =>
                    <Event event={e} editEvent={editEvent} key={e.event_id} />)}

                <Modal isOpen={state.eventBeingEdited != null} onClose={stopEditingEvent}>
                    {() =>
                        state.eventBeingEdited != null &&
                            <form onSubmit={preventingDefault(saveEvent.load)} noValidate>
                                <Col padding={20} pageLevel>
                                    <Input
                                        label='Event name'
                                        disabled={saveEvent.state.kind === 'loading'}
                                        {...fieldToProps(state.eventBeingEdited.fields.name)}
                                    />

                                    <Spacer size={16} />

                                    <Input
                                        label='Event description'
                                        disabled={saveEvent.state.kind === 'loading'}
                                        multiline
                                        {...fieldToProps(state.eventBeingEdited.fields.description)}
                                    />

                                    <Spacer size={16} />

                                    <DateField
                                        label='Start'
                                        disabled={saveEvent.state.kind === 'loading'}
                                        {...fieldToProps(state.eventBeingEdited.fields.start_datetime)}
                                    />

                                    <Spacer size={16} />

                                    <DateField
                                        label='End'
                                        disabled={saveEvent.state.kind === 'loading'}
                                        {...fieldToProps(state.eventBeingEdited.fields.end_datetime)}
                                    />

                                    <Spacer size={16} />

                                    <Input
                                        label='Location'
                                        disabled={saveEvent.state.kind === 'loading'}
                                        {...fieldToProps(state.eventBeingEdited.fields.location)}
                                        value={state.eventBeingEdited.fields.location.value ?? ''}
                                    />

                                    <Spacer size={16} />

                                    <Button isSubmit isPrimary isLoading={saveEvent.state.kind === 'loading'}>
                                        {state.eventBeingEdited.fields.event_id.value == null
                                            ? 'Create event'
                                            : 'Save event'}
                                    </Button>

                                    <Spacer size={8} />

                                    <Button onClick={stopEditingEvent} disabled={saveEvent.state.kind === 'loading'}>
                                        Cancel
                                    </Button>
                                </Col>
                            </form>}
                </Modal>
            </Col>
    )
})

const Event: FC<{ event: Tables['event'], editEvent: (eventId: string) => void }> = observer((props) => {
    const bookmarked = Store.bookmarks.state.result?.event_ids.includes(props.event.event_id)

    const unbookmarkEvent = useRequest(async () => {
        await vibefetch(Store.jwt, '/event/unbookmark', 'post', { event_id: props.event.event_id })
        await Store.bookmarks.load()
    }, { lazy: true })

    const bookmarkEvent = useRequest(async () => {
        await vibefetch(Store.jwt, '/event/bookmark', 'post', { event_id: props.event.event_id })
        await Store.bookmarks.load()
    }, { lazy: true })

    return (
        <div className={'card' + ' ' + 'eventCard' + ' ' + (props.event.created_by_account_id === '-1' ? 'official' : '')}>
            <div className='eventName'>
                <div>{props.event.name}</div>

                {props.event.created_by_account_id === Store.accountInfo.state.result?.account_id &&
                    <Button onClick={() => props.editEvent(props.event.event_id)} style={{ width: 'auto' }}>
                        Edit

                        <Spacer size={8} />

                        <Icon name='edit_calendar' />
                    </Button>}

                {/* onClick={() => Store.currentUser.calendarEvents.push(event.id)} */}
                <Button style={{ width: 'auto' }} onClick={bookmarked ? unbookmarkEvent.load : bookmarkEvent.load}>
                    {bookmarked
                        ? <Icon name='check' />
                        : <Icon name='star_filled' />}
                </Button>
            </div>

            <Spacer size={8} />

            <div className='info'>
                <Icon name='schedule' />
                {props.event.start_datetime.toTimeString() + (props.event.end_datetime ? ` - ${props.event.end_datetime.toTimeString()}` : '')}
            </div>

            <Spacer size={4} />

            <div className='info'>
                <Icon name='location_on' />
                {props.event.location}
            </div>

            <Spacer size={4} />

            <div className='info'>
                <Icon name='person' />
                <span className='eventCreator'>
                    {props.event.created_by_account_id}
                </span>
            </div>

            <Spacer size={8} />

            <pre>
                {props.event.description}
            </pre>
        </div>
    )
})