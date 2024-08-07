import dayjs from 'dayjs'
import React, { useCallback, useMemo, useState } from 'react'

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
import Event from './events/Event'
import EventEditor from './events/EventEditor'

export default React.memo(() => {
    const { scrollToTop, scrollTop } = useSlideScroll()
    const showScrollButton = scrollTop > 100
    const store = useStore()
    const [filter, setFilter] = useState<'All' | 'Bookmarked' | 'Mine'>('All')
    const [searchString, setSearchString] = useState('')

    const visibleEvents = useMemo(() => {
        const allEvents = (store.allEvents.state.result ?? []).filter(e =>
            e.name.toLocaleLowerCase().includes(searchString.toLocaleLowerCase()) ||
            e.creator_name?.toLocaleLowerCase().includes(searchString.toLocaleLowerCase()) ||
            e.description.toLocaleLowerCase().includes(searchString.toLocaleLowerCase()) ||
            e.plaintext_location?.toLocaleLowerCase().includes(searchString.toLocaleLowerCase()) ||
            e.event_site_location_name?.toLocaleLowerCase().includes(searchString.toLocaleLowerCase()))

        switch(filter) {
        case 'All': return allEvents.filter(e => e.start_datetime.isAfter(dayjs().subtract(1, 'day')))
        case 'Bookmarked': return allEvents.filter(e => e.start_datetime.isAfter(dayjs().subtract(1, 'day')) && store.bookmarks.state.result?.event_ids.includes(e.event_id))
        case 'Mine': return allEvents.filter(e => e.created_by_account_id === store.jwtPayload?.account_id)
        }
    }, [filter, store.allEvents.state.result, store.bookmarks.state.result?.event_ids, store.jwtPayload?.account_id, searchString])

    const [eventBeingEdited, setEventBeingEdited] = useState<DayjsEvent | 'new' | undefined>(undefined)

    const editEvent = useCallback((eventId: string) => setEventBeingEdited(store.allEvents.state.result?.find(e => e.event_id === eventId)), [store.allEvents.state.result])
    const createNewEvent = useCallback(() => setEventBeingEdited('new') , [])
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
                            placeholder='Search...'
                            value={searchString}
                            onChange={setSearchString}
                        />

                        <Spacer size={8} />

                        <Button style={{ width: 'auto' }} onClick={() => setSearchString('')} disabled={searchString === ''}>
                            Clear search
                        </Button>
                    </Row>

                    <Spacer size={8} />

                    <RowSelect
                        options={['All', 'Bookmarked', 'Mine']}
                        value={filter}
                        onChange={setFilter}
                        style={{ padding: '0 20px' }}
                    />

                    <Spacer size={12} />

                    <Button className={'scrollToTopButton' + ' ' + (!showScrollButton ? 'hidden' : '')} style={{ opacity: showScrollButton ? 1 : 0, pointerEvents: showScrollButton ? undefined : 'none' }} onClick={scrollToTop} >
                        <Icon name='arrow_back' />
                        <Spacer size={6} />
                        Scroll to top
                    </Button>

                    <Events events={visibleEvents} editEvent={editEvent} />

                    <Modal isOpen={eventBeingEdited != null} onClose={stopEditingEvent} side='right'>
                        {() =>
                            eventBeingEdited && <EventEditor eventBeingEdited={eventBeingEdited} onDone={stopEditingEvent} />}
                    </Modal>
                </>}
        </Col>
    )
})

function Events({ events, editEvent }: {events: readonly DayjsEvent[], editEvent: (eventId: string) => void}) {
    const store = useStore()

    let currentFestival: DayjsFestival | undefined

    return <>
        {events?.map(e => {
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
