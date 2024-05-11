import dayjs, { Dayjs } from 'dayjs'
import React, { FC } from 'react'

import { TABLE_ROWS, Tables } from '../../../back-end/types/db-types'
import { Routes } from '../../../back-end/types/route-types'
import { given, objectEntries, objectFromEntries } from '../../../back-end/utils/misc'
import { useObservableClass } from '../mobx/hooks'
import { observer, setter,setTo } from '../mobx/misc'
import { request } from '../mobx/request'
import Store from '../stores/Store'
import { fieldProps, preventingDefault, someValue, validate } from '../utils'
import { vibefetch } from '../vibefetch'
import Button from './core/Button'
import Col from './core/Col'
import DateField, { formatNoTimezone } from './core/DateField'
import Icon from './core/Icon'
import InfoBlurb from './core/InfoBlurb'
import Input from './core/Input'
import LoadingDots from './core/LoadingDots'
import Modal from './core/Modal'
import RadioGroup from './core/RadioGroup'
import Row from './core/Row'
import RowSelect from './core/RowSelect'
import Spacer from './core/Spacer'

type InProgressEvent = {
    event_id: Tables['event']['event_id'] | undefined,
    name: string,
    description: string,
    start_datetime: Dayjs | null,
    end_datetime: Dayjs | null,
    plaintext_location: string | null,
    event_site_location: Tables['event_site']['event_site_id'] | null,
    event_type: Tables['event']['event_type'] | undefined,
    bookmarks?: unknown,
    created_by?: unknown,
    creator_name?: unknown
}

class EventsScreenState {
    eventBeingEdited: InProgressEvent | null = null
    showingEventErrors = false

    filter: 'All' | 'Bookmarked' | 'Mine' = 'All'

    get bookmarkedEvents() {
        return Store.allEvents.state.result?.filter(e => Store.bookmarks.state.result?.event_ids.includes(e.event_id))
    }

    get myEvents() {
        return Store.allEvents.state.result?.filter(e => e.created_by_account_id === Store.jwtPayload?.account_id)
    }

    get visibleEvents() {
        if (this.filter === 'All') {
            return Store.allEvents.state.result?.filter(e => e.start_datetime.isAfter(dayjs().subtract(1, 'day')))
        } else if (this.filter === 'Bookmarked') {
            return this.bookmarkedEvents
        } else if (this.filter === 'Mine') {
            return this.myEvents
        }
    }

    get eventErrors() {
        if (this.eventBeingEdited == null) {
            return {}
        }

        return validate(this.eventBeingEdited, {
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
                const start = this.eventBeingEdited?.start_datetime
                if (start != null && val != null && start >= val) {
                    return 'End date/time is before start date/time'
                }
            }
        })
    }

    readonly createNewEvent = () => {
        this.eventBeingEdited = {
            event_id: undefined,
            name: '',
            description: '',
            start_datetime: null,
            end_datetime: null,
            plaintext_location: null,
            event_site_location: null,
            event_type: undefined
        }
    }

    readonly editEvent = (eventId: string) => {
        const existing = Store.allEvents.state.result?.find(e => e.event_id === eventId)

        if (existing) {
            this.eventBeingEdited = { ...existing }
        }
    }

    readonly saveEvent = request(async () => {
        this.showingEventErrors = true
        if (this.eventBeingEdited == null || someValue(this.eventErrors, e => e != null)) {
            return
        }

        const { start_datetime, end_datetime, bookmarks, created_by, creator_name, ...event } = this.eventBeingEdited

        await vibefetch(Store.jwt, '/event/save', 'post', {
            event: {
                ...event,
                start_datetime: formatNoTimezone(start_datetime!),
                end_datetime: end_datetime && formatNoTimezone(end_datetime)
            }
        })
        await Store.allEvents.load()
        this.stopEditingEvent()
    }, { lazy: true })

    readonly deleteEvent = request(async () => {
        const event_id = this.eventBeingEdited?.event_id
        if (event_id != null) {
            await vibefetch(Store.jwt, '/event/delete', 'post', { event_id })
            await Store.allEvents.load()
            this.eventBeingEdited = null
        }
    }, { lazy: true })

    readonly stopEditingEvent = () => {
        this.eventBeingEdited = null
    }
}

export default observer(() => {
    const state = useObservableClass(EventsScreenState)

    const loading = Store.accountInfo.state.kind === 'loading' || Store.allEvents.state.kind === 'loading'
    const loadingOrError = loading || Store.accountInfo.state.kind === 'error'

    return (
        <Col padding='20px 0' pageLevel justify={loadingOrError ? 'center' : undefined} align={loadingOrError ? 'center' : undefined}>
            {loading
                ? <LoadingDots size={100} color='var(--color-accent-1)' />
                : <>
                    <Row justify='space-between' padding='0 20px'>
                        <h1 style={{ fontSize: 24 }}>
                            Events
                        </h1>

                        {someValue(Store.purchasedTicketsByFestival, t => t != null && t.length > 0) &&
                            <Button onClick={state.createNewEvent} isCompact style={{ width: 'auto' }}>
                                Create event

                                <Spacer size={8} />

                                <Icon name='calendar_add_on' />
                            </Button>}
                    </Row>

                    <Spacer size={8} />

                    <RowSelect
                        options={['All', 'Bookmarked', 'Mine']}
                        value={state.filter}
                        onChange={setter(state, 'filter')}
                        style={{ padding: '0 20px' }}
                    />

                    <Spacer size={12} />

                    {renderEvents(state.visibleEvents, state.editEvent)}

                    <Modal isOpen={state.eventBeingEdited != null} onClose={state.stopEditingEvent} side='right'>
                        {() =>
                            state.eventBeingEdited != null &&
                                <EventEditor
                                    eventsScreenState={state}
                                />}
                    </Modal>
                </>}
        </Col>
    )
})

function renderEvents(events: typeof Store.allEvents.state.result, editEvent: (eventId: string) => void) {
    let currentFestival: (NonNullable<typeof Store.festivals.state.result>)[number] | undefined

    return events?.map(e => {
        const festival = Store.festivals.state.result?.find(f =>
            e.start_datetime.isAfter(f.start_date.startOf('day')) &&
            e.start_datetime.isBefore(f.end_date.endOf('day')))

        const isFirst = festival !== currentFestival
        currentFestival = festival

        return (
            <Event
                event={e}
                editEvent={editEvent}
                duringFestival={currentFestival?.festival_name}
                firstOfFestival={isFirst}
                key={e.event_id}
            />
        )
    })
}

const Event: FC<{
    event: Omit<Routes['/events']['response']['events'][number], 'start_datetime' | 'end_datetime'> & {
        start_datetime: Dayjs,
        end_datetime: Dayjs | null
    },
    editEvent: (eventId: string) => void,
    firstOfFestival?: boolean,
    duringFestival?: string,
}> = observer((props) => {
    const state = useObservableClass(class {

        /**
         * For smoother interactivity, optimistically change UI bookmark status
         * without waiting for network request
         */
        bookmarkStatusOptimistic: boolean | null = null

        get bookmarked() {
            return this.bookmarkStatusOptimistic ?? Store.bookmarks.state.result?.event_ids.includes(props.event.event_id)
        }

        get when() {
            const now = dayjs.utc()
            const timeOnly = 'h:mma'
            const dateAndTime = (d: Dayjs) => (
                now.isSame(d, 'year')
                    ? 'ddd, M/D [at] ' + timeOnly
                    : 'ddd, M/D/YYYY [at] ' + timeOnly
            )

            if (props.event.end_datetime == null) {
                return props.event.start_datetime.format(dateAndTime(props.event.start_datetime))
            } else if (props.event.end_datetime.isSame(props.event.start_datetime, 'day')) {
                return props.event.start_datetime.format(dateAndTime(props.event.start_datetime)) + ' - ' + props.event.end_datetime.format(timeOnly)
            } else {
                return props.event.start_datetime.format(dateAndTime(props.event.start_datetime)) + ' - ' + props.event.end_datetime.format(dateAndTime(props.event.end_datetime))
            }
        }

        readonly unbookmarkEvent = request(async () => {
            await vibefetch(Store.jwt, '/event/unbookmark', 'post', { event_id: props.event.event_id })
            await Store.bookmarks.load()
        }, { lazy: true })

        readonly bookmarkEvent = request(async () => {
            await vibefetch(Store.jwt, '/event/bookmark', 'post', { event_id: props.event.event_id })
            await Store.bookmarks.load()
        }, { lazy: true })

        readonly toggleBookmark = async () => {

            try {
                if (this.bookmarked) {
                    this.bookmarkStatusOptimistic = false
                    await this.unbookmarkEvent.load()
                } else {
                    this.bookmarkStatusOptimistic = true
                    await this.bookmarkEvent.load()
                }
            } finally {
                this.bookmarkStatusOptimistic = null
            }
        }

        readonly editEvent = () => props.editEvent(props.event.event_id)
    })

    const eventCreatorLabel = (
        props.event.event_type === 'TEAM_OFFICIAL' ? 'Vibecamp team' :
            props.event.event_type === 'CAMPSITE_OFFICIAL' ? 'Campsite' :
                props.event.creator_name
    )

    return (
        <div className={'eventCardWrapper' + ' ' + (props.duringFestival ? 'duringFestival' : '') + ' ' + (props.firstOfFestival ? 'firstOfFestival' : '')}>
            {props.firstOfFestival &&
                <div className='festivalStart'>
                    {props.duringFestival}
                </div>}

            <div className={'card' + ' ' + 'eventCard' + ' ' + (props.event.created_by_account_id === '-1' ? 'official' : '') + ' ' + props.event.event_type}>
                <div className='eventName'>
                    <div>{props.event.name}</div>

                    <div style={{ flexGrow: 1, flexShrink: 1 }}></div>

                    {props.event.created_by_account_id === Store.accountInfo.state.result?.account_id &&
                    <Button onClick={state.editEvent} isCompact style={{ width: 'auto' }}>
                        Edit

                        <Spacer size={8} />

                        <Icon name='edit_calendar' style={{ fontSize: '1em' }} />
                    </Button>}

                    <Spacer size={8} />

                    <Button onClick={state.toggleBookmark} isCompact style={{ width: 'auto' }}>
                        <Icon name='star' fill={state.bookmarked ? 1 : 0} style={{ fontSize: '1em' }} />
                    </Button>
                </div>

                <Spacer size={8} />

                {eventCreatorLabel &&
                <>
                    <div className='info host' title='Host'>
                        <Icon name='person' />
                        <span className='eventCreator'>
                            {eventCreatorLabel}
                        </span>
                    </div>

                    <Spacer size={4} />
                </>}

                <div className='info'>
                    <Icon name='schedule' />
                    <span>
                        {state.when}
                    </span>
                </div>

                <Spacer size={4} />

                <div className='info'>
                    <Icon name='location_on' />
                    <span>
                        {props.event.plaintext_location || props.event.event_site_location_name}
                    </span>
                </div>

                <Spacer size={4} />

                <div className='info' title='Bookmarked by'>
                    <Icon name='star'/>
                    <span>
                        {props.event.bookmarks}
                    </span>
                </div>

                <Spacer size={8} />

                <pre>
                    {props.event.description}
                </pre>
            </div>
        </div>
    )
})

const EventEditor = observer((props: { eventsScreenState: EventsScreenState }) => {
    const state = useObservableClass(class {
        locationType: 'Onsite' | 'Offsite' = 'Onsite'
        confirmingDeletion = false

        get isSaving() {
            return props.eventsScreenState.saveEvent.state.kind === 'loading'
        }

        readonly setLocationType = (t: typeof this['locationType']) => {
            this.locationType = t

            if (this.locationType === 'Onsite') {
                props.eventsScreenState.eventBeingEdited!.plaintext_location = null
            } else {
                props.eventsScreenState.eventBeingEdited!.event_site_location = null
            }
        }

        get ongoingFestivals() {
            const start = props.eventsScreenState.eventBeingEdited?.start_datetime
            if (start != null) {
                return Store.festivalsHappeningAt(start)
            } else {
                return []
            }
        }

        get ongoingFestivalsEventSites() {
            return this.ongoingFestivals.map(f => Store.eventSites.state.result?.filter(s => s.festival_site_id === f.festival_site_id) ?? []).flat()
        }
    })

    if (props.eventsScreenState.eventBeingEdited == null) {
        return null
    }

    const selectedSite = Store.eventSites.state.result?.find(site => site.event_site_id === props.eventsScreenState.eventBeingEdited?.event_site_location)

    const renderLocationInput = () =>
        props.eventsScreenState.eventBeingEdited &&
            <Input
                label='Location'
                disabled={state.isSaving}
                multiline
                {...fieldProps(
                    props.eventsScreenState.eventBeingEdited,
                    'plaintext_location',
                    props.eventsScreenState.eventErrors,
                    props.eventsScreenState.showingEventErrors,
                )}
                value={props.eventsScreenState.eventBeingEdited.plaintext_location ?? ''}
            />

    return (
        <form onSubmit={preventingDefault(props.eventsScreenState.saveEvent.load)} noValidate>
            <Col padding={20} pageLevel>
                <Input
                    label='Event name'
                    disabled={state.isSaving}
                    {...fieldProps(
                        props.eventsScreenState.eventBeingEdited,
                        'name',
                        props.eventsScreenState.eventErrors,
                        props.eventsScreenState.showingEventErrors,
                    )}
                />

                <Spacer size={16} />

                <Input
                    label='Event description'
                    disabled={state.isSaving}
                    multiline
                    {...fieldProps(
                        props.eventsScreenState.eventBeingEdited,
                        'description',
                        props.eventsScreenState.eventErrors,
                        props.eventsScreenState.showingEventErrors,
                    )}
                />

                <Spacer size={16} />

                <DateField
                    label='Start'
                    disabled={state.isSaving}
                    {...fieldProps(
                        props.eventsScreenState.eventBeingEdited,
                        'start_datetime',
                        props.eventsScreenState.eventErrors,
                        props.eventsScreenState.showingEventErrors,
                    )}
                />

                <Spacer size={16} />

                <DateField
                    label='End'
                    disabled={state.isSaving}
                    {...fieldProps(
                        props.eventsScreenState.eventBeingEdited,
                        'end_datetime',
                        props.eventsScreenState.eventErrors,
                        props.eventsScreenState.showingEventErrors,
                    )}
                />

                <Spacer size={16} />

                {state.ongoingFestivals?.length === 0
                    ? renderLocationInput()
                    : <>
                        <InfoBlurb>
                            Your event can take place at {state.ongoingFestivals[0]?.festival_name ?? 'the festival'}, or it can take
                            place before/after.
                            <br /><br />
                            Campsite locations have limited capacity, and
                            scheduling will be first-come-first-serve for a given place
                            + time.
                        </InfoBlurb>

                        <Spacer size={16} />

                        <RowSelect
                            label='My event will be...'
                            options={['Onsite', 'Offsite']}
                            value={state.locationType}
                            onChange={state.setLocationType}
                        />

                        <Spacer size={16} />

                        {state.locationType === 'Onsite'
                            ? <>
                                <RadioGroup
                                    label='Campsite locations:'
                                    options={
                                        state.ongoingFestivalsEventSites
                                            ?.map(s => ({
                                                value: s.event_site_id,
                                                label: s.name
                                            })) ?? []}
                                    directon='row'
                                    {...fieldProps(
                                        props.eventsScreenState.eventBeingEdited,
                                        'event_site_location',
                                        props.eventsScreenState.eventErrors,
                                        props.eventsScreenState.showingEventErrors,
                                    )}
                                />
                            </>
                            : renderLocationInput()}
                    </>}

                <Spacer size={8} />

                {selectedSite &&
                    <EventSiteInfo eventSite={selectedSite} />}

                <Spacer size={16} />

                {Store.accountInfo.state.result?.is_team_member &&
                    <RowSelect
                        label='Is this an official event?'
                        options={TABLE_ROWS.event_type.map(({ event_type_id }) => EVENT_TYPE_LABELS[event_type_id])}
                        {...fieldProps(
                            props.eventsScreenState.eventBeingEdited,
                            'event_type',
                            props.eventsScreenState.eventErrors,
                            props.eventsScreenState.showingEventErrors,
                        )}
                        value={given(props.eventsScreenState.eventBeingEdited?.event_type, t => EVENT_TYPE_LABELS[t]) ?? undefined}
                        onChange={t => props.eventsScreenState.eventBeingEdited!.event_type = EVENT_TYPE_LABEL_IDS[t]}
                    />}

                <Spacer size={16} />

                <InfoBlurb>
                    NOTE: Anyone who has a my.vibe.camp account will
                    be able to see the events you have created!
                </InfoBlurb>

                <Spacer size={16} />

                <Button isSubmit isPrimary isLoading={state.isSaving}>
                    {props.eventsScreenState.eventBeingEdited.event_id == null
                        ? 'Create event'
                        : 'Save event'}
                </Button>

                <Spacer size={8} />

                {props.eventsScreenState.eventBeingEdited.event_id != null
                    && <>
                        <Button isDanger onClick={setTo(state, 'confirmingDeletion', true)}>
                            Delete event
                        </Button>

                        <Modal isOpen={state.confirmingDeletion} side='right'>
                            {() => (
                                <Col align='center' justify='center' padding={20} pageLevel>
                                    <div style={{ fontSize: 22, textAlign: 'center' }}>
                                Are you sure you want to delete {props.eventsScreenState.eventBeingEdited?.name}?
                                    </div>

                                    <Spacer size={16} />

                                    <Button isDanger isPrimary onClick={props.eventsScreenState.deleteEvent.load} isLoading={props.eventsScreenState.deleteEvent.state.kind === 'loading'}>
                                Yes, delete the event
                                    </Button>

                                    <Spacer size={8} />

                                    <Button onClick={setTo(state, 'confirmingDeletion', false)} disabled={props.eventsScreenState.deleteEvent.state.kind === 'loading'}>
                                Cancel
                                    </Button>
                                </Col>
                            )}
                        </Modal>

                        <Spacer size={8} />
                    </>}

                <Button onClick={props.eventsScreenState.stopEditingEvent} disabled={state.isSaving}>
                    Cancel
                </Button>
            </Col>
        </form>
    )
})

const EVENT_TYPE_LABELS = objectFromEntries(
    TABLE_ROWS.event_type
        .map(({ event_type_id }) =>
            [event_type_id, event_type_id[0] + event_type_id.replace('_OFFICIAL', '').substring(1).toLocaleLowerCase()] as const)
)

const EVENT_TYPE_LABEL_IDS = objectFromEntries(
    objectEntries(EVENT_TYPE_LABELS).map(([k, v]) => [v, k] as const)
)

const EventSiteInfo = observer((props: { eventSite: Tables['event_site'] }) => {

    return (
        <div>
            <div style={{ fontWeight: 'bold' }}>
                Location info
            </div>

            {props.eventSite.description &&
            <>
                <Spacer size={4} />

                <div>
                    {props.eventSite.description}
                </div>
            </>}

            <Spacer size={4} />

            <div>
                Type: {props.eventSite.structure_type}
            </div>

            {props.eventSite.people_cap &&
                <>
                    <Spacer size={4} />

                    <div>
                        Max capacity: {props.eventSite.people_cap}
                    </div>
                </>}
            {props.eventSite.equipment &&
                <>
                    <Spacer size={4} />

                    <div>
                        Available equipment: {props.eventSite.equipment}
                    </div>
                </>}
        </div>
    )
})