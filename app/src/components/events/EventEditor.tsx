'use client'

import { Fragment, type ReactNode, useMemo, useRef, useState } from 'react'
import { fill } from '@/copy/fill'
import { t } from '@/copy/t'
import type { Tables } from '@/db/types'
import useBooleanState from '@/hooks/useBooleanState'
import useForm, { fieldToProps } from '@/hooks/useForm'
import { type DayjsEvent, useStore } from '@/hooks/useStore'
import type { Dayjs } from '@/lib/dayjs'
import { vibefetch } from '@/lib/fetch'
import { checkInProgressEventOverlap } from '@/lib/rules'
import { DEFAULT_FORM_ERROR } from '@/lib/ui'
import Button from '../core/Button'
import Checkbox from '../core/Checkbox'
import DateTimeField, { formatNoTimezone } from '../core/DateTimeField'
import ErrorMessage from '../core/ErrorMessage'
import InfoBlurb from '../core/InfoBlurb'
import Input from '../core/Input'
import RadioGroup from '../core/RadioGroup'
import RowSelect from '../core/RowSelect'
import EventDeletionModal from './EventDeletionModal'
import EventOverlapModal from './EventOverlapModal'
import EventSiteInfo from './EventSiteInfo'

type InProgressEvent = {
    event_id: Tables['event']['event_id'] | undefined
    name: string
    description: string
    start_datetime: Dayjs | null
    end_datetime: Dayjs | null
    plaintext_location: string | null
    event_site_location: Tables['event_site']['event_site_id'] | null
    tags: Tables['event']['tags']
    av_needs: string | null
}

type Props = {
    eventBeingEdited: DayjsEvent | 'new'
    onDone: () => void
    onDeleted: () => void
}

const LOCATION_TYPE_OPTIONS = [
    t('eventEditor.locationOnsite'),
    t('eventEditor.locationOffsite'),
] as const
type LocationType = (typeof LOCATION_TYPE_OPTIONS)[number]

const emphasizeDeadline = (paragraph: string): ReactNode => {
    const deadline = t('eventEditor.avAgreementDeadline')
    const [before, after] = paragraph.split(deadline)
    if (after == null) {
        return paragraph
    }
    return (
        <>
            {before}
            <b>{deadline}</b>
            {after}
        </>
    )
}

function paragraphs(
    text: string,
    decorate: (paragraph: string) => ReactNode = (p) => p,
): ReactNode[] {
    let offset = 0
    return text.split('\n\n').map((paragraph) => {
        const key = offset
        offset += paragraph.length + 2
        return (
            <Fragment key={key}>
                {key > 0 && (
                    <>
                        <br />
                        <br />
                    </>
                )}
                {decorate(paragraph)}
            </Fragment>
        )
    })
}

export default function EventEditor({ eventBeingEdited, onDone, onDeleted }: Props) {
    const store = useStore()
    const eventSites = store.eventSites
    const festivals = store.festivals
    const allEvents = store.allEvents.state.result

    const event_id = typeof eventBeingEdited === 'object' ? eventBeingEdited.event_id : undefined

    const [avChecked, setAvChecked] = useState<boolean>(
        eventBeingEdited === 'new' || eventBeingEdited.av_needs != null,
    )

    const initial: InProgressEvent =
        eventBeingEdited === 'new'
            ? {
                  event_id: undefined,
                  name: '',
                  description: '',
                  start_datetime: null,
                  end_datetime: null,
                  plaintext_location: null,
                  event_site_location: null,
                  tags: [],
                  av_needs: null,
              }
            : {
                  event_id: eventBeingEdited.event_id,
                  name: eventBeingEdited.name,
                  description: eventBeingEdited.description,
                  start_datetime: eventBeingEdited.start_datetime,
                  end_datetime: eventBeingEdited.end_datetime,
                  plaintext_location: eventBeingEdited.plaintext_location,
                  event_site_location: eventBeingEdited.event_site_location,
                  tags: eventBeingEdited.tags,
                  av_needs: eventBeingEdited.av_needs,
              }

    const {
        state: confirmingOverlap,
        setTrue: openOverlapModal,
        setFalse: closeOverlapModal,
    } = useBooleanState(false)
    const overlapConfirmed = useRef(false)

    const {
        state: confirmingDeletion,
        setTrue: openDeletionModal,
        setFalse: closeDeletionModal,
    } = useBooleanState(false)

    const [locationType, setLocationType] = useState<LocationType>(
        initial.plaintext_location != null && initial.event_site_location == null
            ? t('eventEditor.locationOffsite')
            : t('eventEditor.locationOnsite'),
    )

    const {
        fields,
        values: inProgressEvent,
        handleSubmit,
        submitting,
        wholeFormError,
    } = useForm<InProgressEvent>({
        initial,
        validators: {
            name: (val) => {
                if (val === '') {
                    return t('eventEditor.nameRequired')
                }
            },
            start_datetime: (val) => {
                if (val == null) {
                    return t('eventEditor.startRequired')
                }
            },
            end_datetime: (val, { start_datetime }) => {
                if (start_datetime != null && val != null && start_datetime >= val) {
                    return t('eventEditor.endBeforeStart')
                }
            },
            av_needs: (val, { event_site_location }) => {
                const site = eventSites?.find((s) => s.event_site_id === event_site_location)
                if (site?.is_av_site && avChecked && (val == null || val.trim() === '')) {
                    return t('eventEditor.avNeedsRequired')
                }
            },
        },
        submit: async ({ start_datetime, end_datetime, ...event }) => {
            if (overlappingEvents.length > 0 && !overlapConfirmed.current) {
                openOverlapModal()
                return
            }
            overlapConfirmed.current = false

            if (start_datetime == null) {
                return
            }

            const submittingSite = eventSites?.find(
                (s) => s.event_site_id === event.event_site_location,
            )
            const av_needs = submittingSite?.is_av_site && avChecked ? event.av_needs : null

            const res = await vibefetch(store.jwt, '/event/save', 'post', {
                event: {
                    ...event,
                    av_needs,
                    start_datetime: formatNoTimezone(start_datetime),
                    end_datetime: formatNoTimezone(end_datetime) ?? null,
                },
            })
            if (res.status !== 200) {
                return DEFAULT_FORM_ERROR
            }

            await store.allEvents.load()
            onDone()
        },
    })

    const confirmOverlap = () => {
        overlapConfirmed.current = true
        closeOverlapModal()
        handleSubmit()
    }

    const changeLocationType = (type: LocationType) => {
        setLocationType(type)
        if (type === t('eventEditor.locationOnsite')) {
            fields.plaintext_location.set(null)
        } else {
            fields.event_site_location.set(null)
        }
    }

    const start = fields.start_datetime.value
    const ongoingFestivals =
        start != null
            ? (festivals?.filter(
                  (f) => start.isAfter(f.start_date) && start.isBefore(f.end_date),
              ) ?? [])
            : []

    const eventSiteOptions = ongoingFestivals
        .flatMap(
            (f) =>
                eventSites?.filter(
                    (s) => s.festival_site_id === f.festival_site_id && !s.forbidden_for_new_events,
                ) ?? [],
        )
        .map((s) => ({ value: s.event_site_id, label: s.name }))

    const selectedSite = eventSites?.find(
        (site) => site.event_site_id === fields.event_site_location.value,
    )

    const overlappingEvents = useMemo(() => {
        if (!inProgressEvent.start_datetime || !inProgressEvent.event_site_location) {
            return []
        }
        return allEvents?.filter((e) => checkInProgressEventOverlap(inProgressEvent, e)) ?? []
    }, [allEvents, inProgressEvent])

    const locationInput = (
        <Input
            label={t('eventEditor.locationLabel')}
            disabled={submitting}
            multiline
            {...fieldToProps(fields.plaintext_location)}
            onChange={(value) => {
                fields.plaintext_location.set(value)
                fields.event_site_location.set(null)
            }}
        />
    )

    return (
        <form onSubmit={handleSubmit} noValidate className='stack'>
            <Input
                label={t('eventEditor.nameLabel')}
                disabled={submitting}
                {...fieldToProps(fields.name)}
            />

            <Input
                label={t('eventEditor.descriptionLabel')}
                disabled={submitting}
                multiline
                {...fieldToProps(fields.description)}
            />

            <DateTimeField
                label={t('eventEditor.startLabel')}
                disabled={submitting}
                {...fieldToProps(fields.start_datetime)}
            />

            <DateTimeField
                label={t('eventEditor.endLabel')}
                disabled={submitting}
                min={fields.start_datetime.value}
                {...fieldToProps(fields.end_datetime)}
            />

            {ongoingFestivals.length === 0 ? (
                locationInput
            ) : (
                <>
                    <InfoBlurb>
                        {paragraphs(
                            fill(t('eventEditor.locationBlurb'), {
                                festivalName:
                                    ongoingFestivals[0]?.festival_name ??
                                    t('eventEditor.theFestival'),
                            }),
                        )}
                    </InfoBlurb>

                    <RowSelect
                        label={t('eventEditor.locationTypeLabel')}
                        options={LOCATION_TYPE_OPTIONS}
                        value={locationType}
                        onChange={changeLocationType}
                    />

                    {locationType === t('eventEditor.locationOnsite') ? (
                        <RadioGroup
                            label={t('eventEditor.campsiteLocationsLabel')}
                            options={eventSiteOptions}
                            direction='row'
                            {...fieldToProps(fields.event_site_location)}
                            onChange={(value) => {
                                fields.event_site_location.set(value)
                                fields.plaintext_location.set(null)
                            }}
                        />
                    ) : (
                        locationInput
                    )}
                </>
            )}

            {selectedSite && <EventSiteInfo eventSite={selectedSite} />}

            {selectedSite?.is_av_site && (
                <>
                    <Checkbox value={avChecked} onChange={setAvChecked} disabled={submitting}>
                        {t('eventEditor.avCheckbox')}
                    </Checkbox>

                    {avChecked && (
                        <>
                            <InfoBlurb>
                                {paragraphs(t('eventEditor.avAgreement'), emphasizeDeadline)}
                            </InfoBlurb>

                            <Input
                                label={t('eventEditor.avNeedsLabel')}
                                disabled={submitting}
                                multiline
                                {...fieldToProps(fields.av_needs)}
                            />
                        </>
                    )}
                </>
            )}

            <ErrorMessage error={wholeFormError} />

            <Button isSubmit isPrimary isLoading={submitting}>
                {event_id == null ? t('events.createEvent') : t('eventEditor.saveEvent')}
            </Button>

            <EventOverlapModal
                isOpen={confirmingOverlap}
                onClose={closeOverlapModal}
                overlappingEvents={overlappingEvents}
                onConfirm={confirmOverlap}
            />

            {event_id != null && (
                <>
                    <Button isDanger onClick={openDeletionModal}>
                        {t('eventEditor.deleteEvent')}
                    </Button>

                    <EventDeletionModal
                        eventId={event_id}
                        eventName={fields.name.value}
                        isOpen={confirmingDeletion}
                        onClose={closeDeletionModal}
                        onDone={onDeleted}
                    />
                </>
            )}

            <Button onClick={onDone} disabled={submitting}>
                {t('common.cancel')}
            </Button>
        </form>
    )
}
