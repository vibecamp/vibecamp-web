'use client'

import { Fragment, type ReactNode, useMemo, useRef, useState } from 'react'
import { fill } from '@/copy/fill'
import { t } from '@/copy/t'
import type { Tables } from '@/db/types'
import useBooleanState from '@/hooks/useBooleanState'
import useForm, { fieldToProps } from '@/hooks/useForm'
import { type DayjsEvent, useStore } from '@/hooks/useStore'
import dayjs, { type Dayjs } from '@/lib/dayjs'
import { vibefetch } from '@/lib/fetch'
import { checkInProgressEventOverlap, festivalOf } from '@/lib/rules'
import { DEFAULT_FORM_ERROR } from '@/lib/ui'
import Button from '../core/Button'
import Checkbox from '../core/Checkbox'
import DateTimeField, { formatNoTimezone } from '../core/DateTimeField'
import ErrorMessage from '../core/ErrorMessage'
import InfoBlurb from '../core/InfoBlurb'
import InfoButton from '../core/InfoButton'
import Input from '../core/Input'
import RadioGroup from '../core/RadioGroup'
import LocationFacts from '../locations/LocationFacts'
import LocationPicker from '../locations/LocationPicker'
import MapInset from '../map/MapInset'
import { useToast } from '../Toast'
import EventDeletionModal from './EventDeletionModal'
import EventOverlapModal from './EventOverlapModal'

type InProgressEvent = {
    event_id: Tables['event']['event_id'] | undefined
    name: string
    description: string
    start_datetime: Dayjs | null
    end_datetime: Dayjs | null
    location_id: Tables['location']['location_id'] | null
    tags: Tables['event']['tags']
    av_needs: string | null
    public: boolean
}

type Props = {
    eventBeingEdited: DayjsEvent | 'new'
    onDone: () => void
    onDeleted: () => void
}

const withInfo = (label: string, info: string) => (
    <span>
        {label} <InfoButton name={label} info={info} />
    </span>
)

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
    const toast = useToast()
    const { locationsById } = store
    const festivals = store.festivals
    const allEvents = store.allEvents.state.result

    const event_id = typeof eventBeingEdited === 'object' ? eventBeingEdited.event_id : undefined

    const [avChecked, setAvChecked] = useState<boolean>(
        eventBeingEdited !== 'new' && eventBeingEdited.av_needs != null,
    )

    const initial: InProgressEvent =
        eventBeingEdited === 'new'
            ? {
                  event_id: undefined,
                  name: '',
                  description: '',
                  start_datetime: null,
                  end_datetime: null,
                  location_id: null,
                  tags: [],
                  av_needs: null,
                  public: true,
              }
            : {
                  event_id: eventBeingEdited.event_id,
                  name: eventBeingEdited.name,
                  description: eventBeingEdited.description,
                  start_datetime: eventBeingEdited.start_datetime,
                  end_datetime: eventBeingEdited.end_datetime,
                  location_id: eventBeingEdited.location_id,
                  tags: eventBeingEdited.tags,
                  av_needs: eventBeingEdited.av_needs,
                  public: eventBeingEdited.public,
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
            location_id: (val) => {
                if (val == null) {
                    return t('eventEditor.locationRequired')
                }
            },
            av_needs: (val, { location_id }) => {
                const place = location_id ? locationsById.get(location_id) : undefined
                if (place?.has_av && avChecked && (val == null || val.trim() === '')) {
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

            const { location_id } = event
            if (start_datetime == null || location_id == null) {
                return
            }

            const av_needs =
                locationsById.get(location_id)?.has_av && avChecked ? event.av_needs : null

            const res = await vibefetch(store.jwt, '/event/save', 'post', {
                event: {
                    ...event,
                    location_id,
                    av_needs,
                    start_datetime: formatNoTimezone(start_datetime),
                    end_datetime: formatNoTimezone(end_datetime) ?? null,
                },
            })
            if (res.status === 400 && !event.public) {
                toast(t('eventEditor.ticketHoldersStartInvalid'))
                return
            }
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

    const start = fields.start_datetime.value
    const eventFestival = start != null ? festivalOf(start, festivals) : undefined

    const visibilityFestival =
        eventFestival ?? festivals?.find((f) => !f.end_date.isBefore(dayjs.utc(), 'day'))
    const visibilityOptions: readonly { value: boolean; label: ReactNode }[] = [
        {
            value: true,
            label: withInfo(
                t('eventEditor.visibilityPublic'),
                t('eventEditor.visibilityPublicInfo'),
            ),
        },
        {
            value: false,
            label: withInfo(
                t('eventEditor.visibilityTicketHolders'),
                fill(t('eventEditor.visibilityTicketHoldersInfo'), {
                    festivalName: visibilityFestival?.festival_name ?? t('eventEditor.theFestival'),
                }),
            ),
        },
    ]

    const selected = fields.location_id.value
        ? locationsById.get(fields.location_id.value)
        : undefined

    const overlappingEvents = useMemo(() => {
        if (!inProgressEvent.start_datetime || !selected || selected.can_host_multiple_events) {
            return []
        }
        return allEvents?.filter((e) => checkInProgressEventOverlap(inProgressEvent, e)) ?? []
    }, [allEvents, inProgressEvent, selected])

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

            <LocationPicker
                currentId={initial.location_id}
                disabled={submitting}
                {...fieldToProps(fields.location_id)}
            />

            {selected && <MapInset location={selected} />}

            {selected && <LocationFacts location={selected} />}

            {selected?.has_av && (
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

            <RadioGroup
                label={t('eventEditor.visibilityLabel')}
                options={visibilityOptions}
                disabled={submitting}
                {...fieldToProps(fields.public)}
            />

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
