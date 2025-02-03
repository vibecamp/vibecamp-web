import dayjs, { Dayjs } from 'dayjs'
import React, { useCallback, useMemo, useRef, useState } from 'react'

import { TABLE_ROWS, Tables } from '../../../../back-end/types/db-types'
import { given, objectEntries, objectFromEntries } from '../../../../back-end/utils/misc'
import useBooleanState from '../../hooks/useBooleanState'
import useForm, { fieldToProps } from '../../hooks/useForm'
import { DayjsEvent, useStore } from '../../hooks/useStore'
import { checkNewEventOverlap } from '../../utils'
import { vibefetch } from '../../vibefetch'
import Button from '../core/Button'
import Col from '../core/Col'
import DateField, { formatNoTimezone } from '../core/DateField'
import InfoBlurb from '../core/InfoBlurb'
import Input from '../core/Input'
import Modal from '../core/Modal'
import RadioGroup from '../core/RadioGroup'
import RowSelect from '../core/RowSelect'
import Spacer from '../core/Spacer'
import EventDeletionModal from './EventDeletionModal'
import EventOverlapModal from './EventOverlapModal'
import EventSiteInfo from './EventSiteInfo'

type Props = {
    eventBeingEdited: DayjsEvent | 'new',
    onDone: () => void
}

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

export default React.memo(({ eventBeingEdited, onDone }: Props) => {
    const store = useStore()

    const { state: guidanceModalOpen, setTrue: openGuidanceModal, setFalse: closeGuidanceModal } = useBooleanState(false)

    const event_id = typeof eventBeingEdited === 'object' ? eventBeingEdited.event_id : undefined

    const { fields, handleSubmit, submitting } = useForm<InProgressEvent>({
        initial: (
            eventBeingEdited === 'new'
                ? {
                    event_id: undefined,
                    name: '',
                    description: '',
                    start_datetime: null,
                    end_datetime: null,
                    plaintext_location: null,
                    event_site_location: null,
                    event_type: undefined
                }
                : {
                    event_id: eventBeingEdited.event_id,
                    name: eventBeingEdited.name,
                    description: eventBeingEdited.description,
                    start_datetime: eventBeingEdited.start_datetime,
                    end_datetime: eventBeingEdited.end_datetime,
                    plaintext_location: eventBeingEdited.plaintext_location,
                    event_site_location: eventBeingEdited.event_site_location,
                    event_type: eventBeingEdited.event_type
                }
        ),
        validators: {
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
            end_datetime: (val, { start_datetime }) => {
                if (start_datetime != null && val != null && start_datetime >= val) {
                    return 'End date/time is before start date/time'
                }
            }
        },
        submit: async ({ start_datetime, end_datetime, bookmarks, created_by, creator_name, ...event }) => {
            await vibefetch(store.jwt, '/event/save', 'post', {
                event: {
                    ...event,
                    start_datetime: formatNoTimezone(start_datetime),
                    end_datetime: end_datetime && formatNoTimezone(end_datetime)
                }
            })
            await store.allEvents.load()
            onDone()
        }
    })

    const [locationType, setLocationType] = useState<'Onsite' | 'Offsite'>('Onsite')
    const [confirmingDeletion, setConfirmingDeletion] = useState(false)

    const changeLocationType = useCallback((t: 'Onsite' | 'Offsite') => {
        setLocationType(t)

        switch (t) {
        case 'Onsite': fields.plaintext_location.set(null); break
        case 'Offsite': fields.event_site_location.set(null); break
        }
    }, [fields.event_site_location, fields.plaintext_location])

    const ongoingFestivals = useMemo(() => {
        const start = fields.start_datetime.value

        if (start != null) {
            return store.festivals.state.result
                ?.filter(e =>
                    start.isAfter(dayjs.utc(e.start_date)) &&
                    start.isBefore(dayjs.utc(e.end_date))) ?? []
        } else {
            return []
        }
    }, [fields.start_datetime.value, store.festivals])

    const ongoingFestivalsEventSites = useMemo(() =>
        ongoingFestivals
            .map(f => store.eventSites.state.result?.filter(s => s.festival_site_id === f.festival_site_id) ?? [])
            .flat()
    , [ongoingFestivals, store.eventSites.state.result])

    const selectedSite = useMemo(() =>
        store.eventSites.state.result?.find(site =>
            site.event_site_id === fields.event_site_location.value)
    , [fields.event_site_location.value, store.eventSites.state.result])

    const [confirmingOverlap, setConfirmingOverlap] = useState(false)

    const overlappingEvents = useMemo(() => {
        if (!fields.start_datetime.value || !fields.event_site_location.value) return []

        const currentEvent: InProgressEvent = {
            event_id: event_id,
            name: fields.name.value,
            description: fields.description.value,
            start_datetime: fields.start_datetime.value,
            end_datetime: fields.end_datetime.value,
            plaintext_location: fields.plaintext_location.value,
            event_site_location: fields.event_site_location.value,
            event_type: fields.event_type.value
        }

        return (store.allEvents.state.result ?? []).filter(
            e => checkNewEventOverlap(currentEvent, e, 15)
        )
    }, [
        event_id,
        fields.name.value,
        fields.description.value,
        fields.start_datetime.value,
        fields.end_datetime.value,
        fields.plaintext_location.value,
        fields.event_site_location.value,
        fields.event_type.value,
        store.allEvents.state.result
    ])

    const formRef = useRef<HTMLFormElement>(null)

    return (
        <form ref={formRef} onSubmit={(e) => {
            e.preventDefault()
            if (overlappingEvents.length > 0) {
                setConfirmingOverlap(true)
            } else {
                handleSubmit(e)
            }
        }} noValidate>
            <Col padding={20} pageLevel>
                <Button onClick={openGuidanceModal} isCompact isPrimary>
                    Guidelines for creating events
                </Button>

                <Modal isOpen={guidanceModalOpen} onClose={closeGuidanceModal} side='right' title='Event Creation Advice'>
                    {() =>
                        <Col padding={20}>
                            <p>
                                Vibecamp is an altar to freedom. No rules, no limits. No gods, no masters. That said, all Vibecamp event hosts perpetually grovel at the altar of the four O’s.
                            </p>

                            <Spacer size={8} />

                            <p>
                                <b>Overcommunicate.</b> In the event description, express stakes and risks. Campers want to know what to expect, especially in terms of activity that might ask them to go beyond their comfort zone (non-exhaustively including: nudity, risk of injury, games that play with boundaries/consent). They want to know it whether or not they intend to take part themselves. That’s why it is best to make these stakes clear up front in the event description, even if it risks ruining the mystique. (The mystique that can be ruined by words is not the true mystique.)
                            </p>

                            <Spacer size={8} />

                            <p>
                                <b>Optics.</b> Consider them. No part of the internet is safe from the dreaded sarcastic screenshot retweet, not even my.vibe.camp. There is always an unavoidable risk of context collapse being used maliciously. Hosts are aware of this (without allowing it to paralyze them—see fourth O!) and apply the same kind of care as they would when posting publicly as themselves.
                            </p>

                            <Spacer size={8} />

                            <p>
                                <b>On my head be it.</b> Vibecamp is all about freedom. The price of freedom is responsibility. That’s why event hosts take camper safety as seriously as Vibecamp LLC itself does. Whatever special risks their event may have, the host takes precautions in proportion to those risks. If they neglect this duty in a way that leads to a human cost, they are prepared to own the consequences.
                            </p>

                            <Spacer size={8} />

                            <p>
                                <b>Ovoid fear.</b> That’s right—whatever you want to see at Vibecamp, simply ovoid being too scared to make it happen. If a would-be host is uncertain about the safety or practicality of their event, they can always moot their issue for discussion, for example on the Vibecamp Discord. Whatever the problem is, we’ll solve it together. Remember: no wall is so high that a small group of thoughtful, committed citizens cannot huck a melon over it.
                            </p>
                        </Col>}
                </Modal>

                <Spacer size={16} />

                <Input
                    label='Event name'
                    disabled={submitting}
                    {...fieldToProps(fields.name)}
                />

                <Spacer size={16} />

                <Input
                    label='Event description'
                    disabled={submitting}
                    multiline
                    {...fieldToProps(fields.description)}
                />

                <Spacer size={16} />

                <DateField
                    label='Start'
                    disabled={submitting}
                    {...fieldToProps(fields.start_datetime)}
                />

                <Spacer size={16} />

                <DateField
                    label='End'
                    disabled={submitting}
                    min={fields.start_datetime.value}
                    {...fieldToProps(fields.end_datetime)}
                />

                <Spacer size={16} />

                {ongoingFestivals?.length === 0
                    ? <Input
                        label='Location'
                        disabled={submitting}
                        multiline
                        {...fieldToProps(fields.plaintext_location)}
                        value={fields.plaintext_location.value ?? ''}
                    />
                    : <>
                        <InfoBlurb>
                            Your event can take place at {ongoingFestivals[0]?.festival_name ?? 'the festival'}, or it can take
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
                            value={locationType}
                            onChange={changeLocationType}
                        />

                        <Spacer size={16} />

                        {locationType === 'Onsite'
                            ? <>
                                <RadioGroup
                                    label='Campsite locations:'
                                    options={
                                        ongoingFestivalsEventSites
                                            ?.map(s => ({
                                                value: s.event_site_id,
                                                label: s.name
                                            })) ?? []
                                    }
                                    directon='row'
                                    {...fieldToProps(fields.event_site_location)}
                                />
                            </>
                            : <Input
                                label='Location'
                                disabled={submitting}
                                multiline
                                {...fieldToProps(fields.plaintext_location)}
                                value={fields.plaintext_location.value ?? ''}
                            />}
                    </>}

                <Spacer size={8} />

                {selectedSite &&
                    <EventSiteInfo eventSite={selectedSite} />}

                <Spacer size={16} />

                {store.accountInfo.state.result?.is_team_member &&
                    <RowSelect
                        label='Is this an official event?'
                        options={TABLE_ROWS.event_type.map(({ event_type_id }) => EVENT_TYPE_LABELS[event_type_id])}
                        {...fieldToProps(fields.event_type)}
                        value={given(fields.event_type.value, t => EVENT_TYPE_LABELS[t]) ?? undefined}
                        onChange={t => fields.event_type.set(EVENT_TYPE_LABEL_IDS[t])}
                    />}

                <Spacer size={16} />

                <InfoBlurb>
                    NOTE: Anyone who has a my.vibe.camp account will
                    be able to see the events you have created!
                </InfoBlurb>

                <Spacer size={16} />

                <Button isSubmit isPrimary isLoading={submitting}>
                    {event_id == null
                        ? 'Create event'
                        : 'Save event'}
                </Button>

                <EventOverlapModal
                    isOpen={confirmingOverlap}
                    onClose={() => setConfirmingOverlap(false)}
                    overlappingEvents={overlappingEvents}
                    onConfirm={() => {
                        setConfirmingOverlap(false)
                        const syntheticEvent = new Event('submit') as unknown as React.FormEvent<HTMLFormElement>
                        handleSubmit(syntheticEvent)
                    }}
                />

                <Spacer size={8} />

                {event_id != null
                    && <>
                        <Button isDanger onClick={() => setConfirmingDeletion(true)}>
                            Delete event
                        </Button>

                        <EventDeletionModal
                            eventId={event_id}
                            eventName={fields.name.value}
                            isOpen={confirmingDeletion}
                            onClose={() => setConfirmingDeletion(false)}
                            onDone={onDone}
                        />

                        <Spacer size={8} />
                    </>}

                <Button onClick={onDone} disabled={submitting}>
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