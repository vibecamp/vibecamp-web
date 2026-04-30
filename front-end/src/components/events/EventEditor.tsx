import dayjs from 'dayjs'
import React, { useCallback, useEffect, useMemo, useState } from 'react'

import { TABLE_ROWS, Tables } from '../../../../back-end/types/db-types'
import { given, objectEntries, objectFromEntries } from '../../../../back-end/utils/misc'
import useBooleanState from '../../hooks/useBooleanState'
import useForm, { fieldToProps } from '../../hooks/useForm'
import { DayjsEvent, useStore } from '../../hooks/useStore'
import { InProgressEvent } from '../../types/misc'
import { checkInProgressEventOverlap } from '../../utils'
import { vibefetch } from '../../vibefetch'
import Button from '../core/Button'
import Checkbox from '../core/Checkbox'
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

export default React.memo(({ eventBeingEdited, onDone }: Props) => {
    const store = useStore()

    const { state: guidanceModalOpen, setTrue: openGuidanceModal, setFalse: closeGuidanceModal } = useBooleanState(false)

    const event_id = typeof eventBeingEdited === 'object' ? eventBeingEdited.event_id : undefined

    const [avChecked, setAvChecked] = useState<boolean>(
        eventBeingEdited === 'new' || eventBeingEdited.av_needs != null
    )

    const { fields, values: inProgressEvent, handleSubmit, submitting } = useForm<InProgressEvent>({
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
                    event_type: 'UNOFFICIAL',
                    tags: [],
                    av_needs: null
                }
                : {
                    event_id: eventBeingEdited.event_id,
                    name: eventBeingEdited.name,
                    description: eventBeingEdited.description,
                    start_datetime: eventBeingEdited.start_datetime,
                    end_datetime: eventBeingEdited.end_datetime,
                    plaintext_location: eventBeingEdited.plaintext_location,
                    event_site_location: eventBeingEdited.event_site_location,
                    event_type: eventBeingEdited.event_type,
                    tags: eventBeingEdited.tags,
                    av_needs: eventBeingEdited.av_needs
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
            },
            av_needs: (val, { event_site_location }) => {
                const site = store.eventSites.state.result?.find(s => s.event_site_id === event_site_location)
                if (site?.is_av_site && avChecked && (val == null || val.trim() === '')) {
                    return 'Please describe your A/V needs'
                }
            }
        },
        submit: async ({ start_datetime, end_datetime, bookmarks, created_by, creator_name, ...event }) => {
            if (overlappingEvents.length > 0 && overlapConfirmationState === 'editing') {
                setOverlapConfirmationState('confirming')
            } else {
                const submittingSite = store.eventSites.state.result?.find(s => s.event_site_id === event.event_site_location)
                const av_needs = submittingSite?.is_av_site && avChecked ? event.av_needs : null
                await vibefetch(store.jwt, '/event/save', 'post', {
                    event: {
                        ...event,
                        av_needs,
                        start_datetime: formatNoTimezone(start_datetime!),
                        end_datetime: formatNoTimezone(end_datetime) ?? null
                    }
                })
                await store.allEvents.load()
                onDone()
            }
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
            .map(f =>
                store.eventSites.state.result?.filter(s => s.festival_site_id === f.festival_site_id && !s.forbidden_for_new_events) ?? [])
            .flat()
    , [ongoingFestivals, store.eventSites.state.result])

    const selectedSite = useMemo(() =>
        store.eventSites.state.result?.find(site =>
            site.event_site_id === fields.event_site_location.value)
    , [fields.event_site_location.value, store.eventSites.state.result])

    const overlappingEvents = useMemo(() => {
        if (!inProgressEvent.start_datetime || !inProgressEvent.event_site_location) return []

        return store.allEvents.state.result?.filter(e =>
            checkInProgressEventOverlap(inProgressEvent, e)) ?? []
    }, [inProgressEvent, store.allEvents.state.result])

    const [overlapConfirmationState, setOverlapConfirmationState] = useState<'editing' | 'confirming' | 'confirmed'>('editing')

    const handlePlaintextLocationChange = useCallback((value: string) => {
        fields.plaintext_location.set(value)
        fields.event_site_location.set(null)
    }, [fields.plaintext_location, fields.event_site_location])

    const handleEventSiteLocationChange = useCallback((value: Tables['event_site']['event_site_id'] | null) => {
        fields.event_site_location.set(value)
        fields.plaintext_location.set(null)
    }, [fields.plaintext_location, fields.event_site_location])

    useEffect(() => {
        if (overlapConfirmationState === 'confirmed') {
            handleSubmit()
        }
    }, [handleSubmit, overlapConfirmationState])

    return (
        <form onSubmit={handleSubmit} noValidate>
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
                        onChange={handlePlaintextLocationChange}
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
                            ? <RadioGroup
                                label='Campsite locations:'
                                options={
                                    ongoingFestivalsEventSites
                                        ?.map(s => ({
                                            value: s.event_site_id,
                                            label: s.name
                                        })) ?? []
                                }
                                direction='row'
                                {...fieldToProps(fields.event_site_location)}
                                onChange={handleEventSiteLocationChange}
                            />
                            : <Input
                                label='Location'
                                disabled={submitting}
                                multiline
                                {...fieldToProps(fields.plaintext_location)}
                                value={fields.plaintext_location.value ?? ''}
                                onChange={handlePlaintextLocationChange}
                            />}
                    </>}

                <Spacer size={8} />

                {selectedSite &&
                    <EventSiteInfo eventSite={selectedSite} />}

                {selectedSite?.is_av_site && <>
                    <Spacer size={16} />

                    <Checkbox
                        value={avChecked}
                        onChange={setAvChecked}
                        disabled={submitting}
                    >
                        My event requires A/V equipment or support
                    </Checkbox>

                    {avChecked && <>
                        <Spacer size={8} />

                        <InfoBlurb>
                            By checking this box, you are agreeing to the following:
                            <br /><br />
                            1. I, the event host, will work with Christian, Vibecamp&apos;s head of A/V, to ensure that my A/V needs are communicated beforehand.
                            <br /><br />
                            2. Vibecamp cannot guarantee the use of specific equipment.
                            <br /><br />
                            3. I, the event host, will submit my A/V requirements before <b>FRIDAY, JUNE 5TH, 2026</b>. Vibecamp will not support A/V requests that we receive after Friday, June 5th.
                        </InfoBlurb>

                        <Spacer size={8} />

                        <Input
                            label='Describe your A/V needs'
                            disabled={submitting}
                            multiline
                            {...fieldToProps(fields.av_needs)}
                            value={fields.av_needs.value ?? ''}
                        />
                    </>}
                </>}

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
                    isOpen={overlapConfirmationState === 'confirming'}
                    onClose={() => setOverlapConfirmationState('editing')}
                    overlappingEvents={overlappingEvents}
                    onConfirm={() => setOverlapConfirmationState('confirmed')}
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