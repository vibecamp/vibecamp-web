import dayjs from 'dayjs'
import React, { useCallback, useMemo, useState } from 'react'

import env from '../env'
import useHashState, { EventsFilter } from '../hooks/useHashState'
import { DayjsEvent, DayjsFestival, useStore } from '../hooks/useStore'
import { someValue } from '../utils'
import Button from './core/Button'
import Col from './core/Col'
import Icon from './core/Icon'
import Input from './core/Input'
import LoadingDots from './core/LoadingDots'
import Modal from './core/Modal'
import { useSlideScroll } from './core/MultiView'
import Row from './core/Row'
import RowSelect from './core/RowSelect'
import Spacer from './core/Spacer'
import Event, { EventInfo } from './events/Event'
import EventEditor from './events/EventEditor'

const BACK_END_DOMAIN = env.BACK_END_ORIGIN.replace(/https?:\/\//, '')

export default React.memo(() => {
    const { scrollToTop, scrollTop } = useSlideScroll()
    const showScrollButton = scrollTop > 100
    const store = useStore()
    const { hashState, setHashState } = useHashState()
    const filter = hashState?.eventsFilter ?? 'All'
    const setFilter = useCallback((filter: EventsFilter) => {
        setHashState({
            eventsFilter: filter === 'All' ? undefined : filter
        })
    }, [setHashState])
    const [searchString, setSearchString] = useState('')

    const visibleEvents = useMemo(() => {
        const allEvents = (store.allEvents.state.result ?? []).filter(e =>
            e.name.toLocaleLowerCase().includes(searchString.toLocaleLowerCase()) ||
            e.creator_name?.toLocaleLowerCase().includes(searchString.toLocaleLowerCase()) ||
            e.description.toLocaleLowerCase().includes(searchString.toLocaleLowerCase()) ||
            e.plaintext_location?.toLocaleLowerCase().includes(searchString.toLocaleLowerCase()) ||
            e.event_site_location_name?.toLocaleLowerCase().includes(searchString.toLocaleLowerCase()))

        switch (filter) {
        case 'All': return allEvents.filter(e => e.start_datetime.isAfter(dayjs().subtract(1, 'day')))
        case 'Starred': return allEvents.filter(e => e.start_datetime.isAfter(dayjs().subtract(1, 'day')) && store.bookmarks.state.result?.event_ids.includes(e.event_id))
        case 'Mine': return allEvents.filter(e => e.created_by_account_id === store.jwtPayload?.account_id).toReversed()
        case 'Past': return allEvents.filter(e => e.start_datetime.isBefore(dayjs().subtract(1, 'day'))).toReversed()
        }
    }, [filter, store.allEvents.state.result, store.bookmarks.state.result?.event_ids, store.jwtPayload?.account_id, searchString])

    const [eventBeingEdited, setEventBeingEdited] = useState<DayjsEvent | 'new' | undefined>(undefined)

    const editEvent = useCallback((eventId: string) => setEventBeingEdited(store.allEvents.state.result?.find(e => e.event_id === eventId)), [store.allEvents.state.result])
    const createNewEvent = useCallback(() => setEventBeingEdited('new'), [])
    const stopEditingEvent = useCallback(() => setEventBeingEdited(undefined), [])

    const loading = store.accountInfo.state.kind === 'loading' || store.allEvents.state.kind === 'loading'
    const loadingOrError = loading || store.accountInfo.state.kind === 'error'

    return (
        <Col padding='20px 0' pageLevel justify={loadingOrError ? 'center' : undefined} align={loadingOrError ? 'center' : undefined}>
            {loading
                ? <LoadingDots size={100} color='var(--color-accent-1)' />
                : <>
                    <Row justify='space-between' padding='0 20px'>
                        <h1 style={{ fontSize: 24 }}>
                            Events
                        </h1>

                        {someValue(store.purchasedTicketsByFestival, t => t != null && t.length > 0) &&
                            <Button onClick={createNewEvent} isCompact style={{ width: 'auto' }}>
                                Create event

                                <Spacer size={8} />

                                <Icon name='calendar_add_on' />
                            </Button>}
                    </Row>

                    <Spacer size={8} />

                    <Row justify='stretch' align='center' padding='0 20px'>
                        <Input
                            placeholderIcon='search'
                            placeholder='Search...'
                            value={searchString}
                            onChange={setSearchString}
                            style={{ flexShrink: 1, width: 0 }}
                        />

                        <Spacer size={8} />

                        <Button style={{ width: 'auto', whiteSpace: 'nowrap' }} onClick={() => setSearchString('')} disabled={searchString === ''}>
                            Clear search
                        </Button>
                    </Row>

                    <Spacer size={8} />

                    <RowSelect
                        options={['All', 'Starred', 'Mine', 'Past']}
                        value={filter}
                        onChange={setFilter}
                        style={{ padding: '0 20px' }}
                    />

                    {filter !== 'Mine' &&
                        <>
                            <Spacer size={8} />

                            <Row justify='stretch' align='center' padding='0 20px'>
                                <a className='button' href={filter === 'Starred' ? `webcal://${BACK_END_DOMAIN}/events.ics?account_id=${store.jwtPayload?.account_id}` : `webcal://${BACK_END_DOMAIN}/events.ics`}>
                                    Add {filter === 'Starred' ? 'bookmarks' : 'all events'} to your calendar app
                                    &nbsp;
                                    <Icon name='open_in_new' />
                                </a>
                            </Row>
                        </>}

                    <Spacer size={8} />

                    <Row justify='stretch' align='center' padding='0 20px'>
                        <Button onClick={() => setHashState({ compactEventsView: !hashState?.compactEventsView })}>
                            {hashState?.compactEventsView === true
                                ? 'Switch to card view'
                                : 'Switch to compact view'}
                        </Button>
                    </Row>

                    <Spacer size={12} />

                    <div style={{ fontStyle: 'italic', paddingLeft: 20, paddingRight: 20 }}>
                        Note: Only events marked as

                        &nbsp;
                        <Icon name='person' style={{ color: 'var(--color-accent-1)', fontSize: 18, lineHeight: '19px', marginRight: 4, verticalAlign: 'top' }} />
                        <span style={{ color: 'var(--color-accent-1)', fontStyle: 'normal' }}>Vibecamp team</span>
                        &nbsp;

                        are run and endorsed by the Vibecamp org! All other
                        events are run by individual attendees, who take
                        responsibility for making sure everything stays safe
                        and fun
                    </div>

                    <Spacer size={8} />

                    <Button className={'scrollToTopButton' + ' ' + (!showScrollButton ? 'hidden' : '')} style={{ opacity: showScrollButton ? 1 : 0, pointerEvents: showScrollButton ? undefined : 'none' }} onClick={scrollToTop} >
                        <Icon name='arrow_back' />
                        <Spacer size={6} />
                        Scroll to top
                    </Button>

                    {visibleEvents.length === 0
                        ? <div style={{ textAlign: 'center' }}>(no events)</div>
                        : hashState?.compactEventsView === true
                            ? <CompactEvents events={visibleEvents} editEvent={editEvent} />
                            : <Events events={visibleEvents} editEvent={editEvent} />}

                    <Modal isOpen={eventBeingEdited != null} onClose={stopEditingEvent} side='right'>
                        {() =>
                            eventBeingEdited && <EventEditor eventBeingEdited={eventBeingEdited} onDone={stopEditingEvent} />}
                    </Modal>
                </>}
        </Col>
    )
})

function Events({ events, editEvent }: { events: readonly DayjsEvent[], editEvent: (eventId: string) => void }) {
    const store = useStore()

    let currentFestival: DayjsFestival | undefined

    return <>
        {events.map(e => {
            const festival = store.festivals.state.result?.find(f =>
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
        })}
    </>
}

function CompactEvents({ events, editEvent }: { events: readonly DayjsEvent[], editEvent: (eventId: string) => void }) {
    const { hashState, setHashState, getHashStateString } = useHashState()

    const viewingEvent = useMemo(() => events.find(e => e.event_id === hashState?.viewingEventDetails), [events, hashState?.viewingEventDetails])

    return (
        <>
            <div className='compactEvents'>
                <a className='headings'>
                    <div className='time'>When</div>
                    <div className='name'>What</div>
                    <div className='filmed' />
                </a>
                {events.map(e => {
                    return (
                        <a
                            href={'#' + getHashStateString({ viewingEventDetails: e.event_id })}
                            key={e.event_id}
                        >
                            <div className='time'>{e.start_datetime.format('ddd h:mma')}</div>
                            <div className='name'>{e.name}</div>
                            <div className='filmed'>
                                {e.will_be_filmed &&
                                    <Icon name='videocam' />}
                            </div>
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
}
