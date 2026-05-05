import dayjs from 'dayjs'
import React, { useCallback, useMemo, useState } from 'react'

import { AttendeeInfo } from '../../../back-end/types/misc'
import { exists } from '../../../back-end/utils/misc'
import { BLANK_ATTENDEE, getAttendeeErrors } from '../hooks/usePurchaseFormState'
import { useStore } from '../hooks/useStore'
import { vibefetch } from '../vibefetch'
import { BadgeInfoForm } from './BadgeInfoForm'
import Button from './core/Button'
import Col from './core/Col'
import InfoBlurb from './core/InfoBlurb'
import Modal from './core/Modal'
import Spacer from './core/Spacer'
import AttendeeInfoForm, { Props as AttendeeInfoFormProps } from './tickets/AttendeeInfoForm'

// Renders proactive, account-level prompts for required info that's missing.
// Mounted at the App level so it appears regardless of which view the user is
// looking at.
//
// Priority:
//   1. Primary attendee record missing → required (no dismiss button).
//   2. Has primary attendee, but a ticketed festival is missing badge info →
//      shown as a non-blocking nag (dismissable per session).
export default React.memo(() => {
    const store = useStore()
    const accountInfo = store.accountInfo.state.result

    const primaryAttendee = useMemo(
        () => accountInfo?.attendees.find(a => a.is_primary_for_account),
        [accountInfo?.attendees]
    )

    // The attendee we'd prompt to fill out badge info for, if any. We only
    // prompt for upcoming festivals where the user has an attendance ticket
    // and no badge yet. (purchasedTicketsByFestival already filters to
    // is_attendance_ticket.) Skip festivals flagged pre_badge_integration
    // (matches Account.tsx's existing badge filter).
    const missingBadge = useMemo(() => {
        if (accountInfo == null || primaryAttendee == null) return undefined
        const now = dayjs.utc()
        const candidates = (store.festivals.state.result ?? [])
            .filter(festival =>
                !festival.pre_badge_integration &&
                festival.end_date.isAfter(now) &&
                (store.purchasedTicketsByFestival[festival.festival_id]?.length ?? 0) > 0 &&
                !accountInfo.badges.some(b =>
                    b.festival_id === festival.festival_id &&
                    b.attendee_id === primaryAttendee.attendee_id
                )
            )
            .sort((a, b) => a.start_date.valueOf() - b.start_date.valueOf())
        const festival = candidates[0]
        return festival != null
            ? { festival, attendee_id: primaryAttendee.attendee_id }
            : undefined
    }, [accountInfo, primaryAttendee, store.festivals.state.result, store.purchasedTicketsByFestival])

    const showAttendeePrompt = useMemo(() =>
        accountInfo != null &&
        primaryAttendee == null &&
        Object.values(store.purchasedTicketsByFestival).some(tickets => tickets.length > 0) // has at least one ticket
    , [accountInfo, primaryAttendee, store.purchasedTicketsByFestival])

    const showBadgePrompt = !showAttendeePrompt && missingBadge != null

    return (
        <>
            <Modal isOpen={showAttendeePrompt} side='right' title='Tell us about you'>
                {() => <PrimaryAttendeePrompt />}
            </Modal>

            <Modal isOpen={showBadgePrompt} side='right' title={`Set up your badge for ${missingBadge?.festival.festival_name ?? ''}`}>
                {() => missingBadge && (
                    <BadgeInfoForm
                        festival_id={missingBadge.festival.festival_id}
                        attendee_id={missingBadge.attendee_id}
                    />
                )}
            </Modal>
        </>
    )
})

const PrimaryAttendeePrompt = React.memo(() => {
    const store = useStore()

    const [attendee, setAttendee] = useState<AttendeeInfo>({
        ...BLANK_ATTENDEE,
        is_primary_for_account: true,
        email_address: store.accountInfo.state.result?.email_address ?? null,
    })
    const [submitting, setSubmitting] = useState(false)
    const [showingErrors, setShowingErrors] = useState(false)

    const setAttendeeProperty = useCallback<AttendeeInfoFormProps['setAttendeeProperty']>(
        (_a, property, value) => {
            setAttendee(prev => ({ ...prev, [property]: value } as AttendeeInfo))
        },
        []
    )

    const errors = useMemo(
        () => getAttendeeErrors({ ...attendee, ticket_type: 'placeholder' as never }),
        [attendee]
    )

    const handleSubmit = useCallback(async (e: React.FormEvent) => {
        e.preventDefault()
        setShowingErrors(true)
        if (Object.values(errors).filter(exists).length > 0) return

        setSubmitting(true)
        try {
            await vibefetch(store.jwt, '/account/save-attendees', 'put', {
                attendees: [attendee],
            })
            await store.accountInfo.load()
        } finally {
            setSubmitting(false)
        }
    }, [attendee, errors, store.accountInfo, store.jwt])

    return (
        <form onSubmit={handleSubmit} noValidate>
            <Col padding={20} pageLevel>
                <InfoBlurb>
                    Welcome! We need a bit of info real quick. You can edit
                    any of this later from the Account tab.
                </InfoBlurb>

                <Spacer size={24} />

                <AttendeeInfoForm
                    attendeeInfo={attendee}
                    attendeeErrors={showingErrors ? errors : {}}
                    setAttendeeProperty={setAttendeeProperty}
                    isChild={attendee.age != null && attendee.age < 18}
                    festival={undefined}
                />

                <Spacer size={32} />

                <Button isSubmit isPrimary isLoading={submitting}>
                    Save
                </Button>
            </Col>
        </form>
    )
})
