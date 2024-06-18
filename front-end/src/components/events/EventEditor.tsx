import dayjs, { Dayjs } from 'dayjs'
import React, { useCallback, useMemo, useState } from 'react'

import { TABLE_ROWS, Tables } from '../../../../back-end/types/db-types'
import { given, objectEntries,objectFromEntries } from '../../../../back-end/utils/misc'
import useForm, { fieldToProps } from '../../hooks/useForm'
import { usePromise } from '../../hooks/usePromise'
import { DayjsEvent, useStore } from '../../hooks/useStore'
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

    const deleteEvent = usePromise(async () => {
        if (event_id != null) {
            await vibefetch(store.jwt, '/event/delete', 'post', { event_id })
            await store.allEvents.load()
            onDone()
        }
    }, [event_id, onDone, store.allEvents, store.jwt], { lazy: true })

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

    return (

        <form onSubmit={handleSubmit} noValidate>
            <Col padding={20} pageLevel>
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

                <Spacer size={8} />

                {event_id != null
                    && <>
                        <Button isDanger onClick={() => setConfirmingDeletion(true)}>
                            Delete event
                        </Button>

                        <Modal isOpen={confirmingDeletion} side='right'>
                            {() => (
                                <Col align='center' justify='center' padding={20} pageLevel>
                                    <div style={{ fontSize: 22, textAlign: 'center' }}>
                                        Are you sure you want to delete &quot;{fields.name.value}&quot;?
                                    </div>

                                    <Spacer size={16} />

                                    <Button isDanger isPrimary onClick={deleteEvent.load} isLoading={deleteEvent.state.kind === 'loading'}>
                                        Yes, delete the event
                                    </Button>

                                    <Spacer size={8} />

                                    <Button onClick={() => setConfirmingDeletion(false)} disabled={deleteEvent.state.kind === 'loading'}>
                                        Cancel
                                    </Button>
                                </Col>
                            )}
                        </Modal>

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