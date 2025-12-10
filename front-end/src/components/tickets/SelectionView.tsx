import React, { useMemo } from 'react'

import { PurchaseFormState } from '../../hooks/usePurchaseFormState'
import { DayjsFestival, useStore } from '../../hooks/useStore'
import { preventingDefault, someValue } from '../../utils'
import Button from '../core/Button'
import Col from '../core/Col'
import ErrorMessage from '../core/ErrorMessage'
import Icon from '../core/Icon'
import InfoBlurb from '../core/InfoBlurb'
import Input from '../core/Input'
import NumberInput from '../core/NumberInput'
import RadioGroup from '../core/RadioGroup'
import Spacer from '../core/Spacer'
import AttendeeInfoForm from './AttendeeInfoForm'
import PriceBreakdown from './PriceBreakdown'

type Props = {
    purchaseFormState: PurchaseFormState,
    goToNext: () => void,
    festival: DayjsFestival | undefined
}

export default React.memo(({ purchaseFormState, goToNext, festival }: Props) => {
    const store = useStore()

    const festivalPurchases = useMemo(() =>
        store.purchaseTypeAvailability.state.result
            ?.filter(({ purchaseType, available }) =>
                available > 0 &&
                purchaseType.festival_id === festival?.festival_id) ?? []
    , [festival?.festival_id, store.purchaseTypeAvailability.state.result])

    const attendancePurchases = useMemo(() =>
        festivalPurchases
            .filter(({ purchaseType }) => purchaseType.is_attendance_ticket)
            .sort((a, b) => b.purchaseType.price_in_cents - a.purchaseType.price_in_cents)
    , [festivalPurchases])

    const otherPurchases = useMemo(() =>
        festivalPurchases
            .filter(({ purchaseType }) => !purchaseType.is_attendance_ticket)
            .sort((a, b) => a.purchaseType.description.localeCompare(b.purchaseType.description))
    , [festivalPurchases])

    const attendancePurchaseOptions = useMemo(() =>
        attendancePurchases.map(({ purchaseType }) => ({
            label: `${purchaseType.description} ($${(purchaseType.price_in_cents / 100).toLocaleString()})`,
            value: purchaseType.purchase_type_id
        }))
    , [attendancePurchases])

    const emptySelection = useMemo(() =>
        !someValue(purchaseFormState.purchases, v => v != null && v > 0)
    , [purchaseFormState.purchases])

    if (festival == null) {
        return null
    }

    return (
        <form onSubmit={preventingDefault(goToNext)} noValidate>
            <Col padding={20} pageLevel>

                {purchaseFormState.attendees.map((attendee, index) =>
                    <React.Fragment key={index}>

                        {index > 0 && <>
                            <Spacer size={32} />
                            <hr />
                            <Spacer size={32} />
                        </>}

                        <AttendeeInfoForm
                            attendeeInfo={attendee}
                            attendeeErrors={purchaseFormState.attendeeErrors[index]!}
                            setAttendeeProperty={purchaseFormState.setAttendeeProperty}
                            isChild={attendee.age != null && attendee.age < 18}
                            festival={festival}
                            showFloatingHeading
                        />

                        <Spacer size={32} />

                        <h2 style={{ fontSize: 24 }}>Ticket type for {attendee.name || 'this person'}</h2>

                        <Spacer size={8} />

                        <RadioGroup
                            label=''
                            options={attendancePurchaseOptions}
                            value={attendee.ticket_type}
                            onChange={val => purchaseFormState.setAttendeeProperty(attendee, 'ticket_type', val)}
                            error={purchaseFormState.showingErrors && purchaseFormState.attendeeErrors[index]?.ticket_type}
                        />

                        <Spacer size={24} />

                        {index > 0 &&
                            <>
                                <Spacer size={24} />

                                <Button isDanger onClick={purchaseFormState.removeAttendee(index)}>
                                    Remove {attendee.name || 'attendee'}
                                </Button>
                            </>}

                        <Spacer size={32} />
                    </React.Fragment>)}

                <Button onClick={purchaseFormState.addAttendee}>
                    <Icon name='add' style={{ fontSize: 'inherit' }} />
                    <Spacer size={4} />
                    Bring another attendee
                </Button>

                <Spacer size={12} />

                <InfoBlurb>
                    {`You can purchase a ticket for up to one other adult attendee
                    if you'd like. Their ticket and info will have to be managed
                    through your account here, but they'll otherwise be a full
                    attendee (with a badge and everything). You can purchase
                    additional tickets for up to four minors.`}
                    <Spacer size={8} />
                    {`Minors over two will need their own tickets, but
                    those will live under your account. Children under two years
                    old do not need a ticket.`}
                </InfoBlurb>

                <Spacer size={12} />

                <InfoBlurb>
                    {`NOTE: App features like event creation are per-account!
                    If you buy tickets for multiple people under this account,
                    the others won't be able to create their own events, manage
                    their own bookmarks, etc. Generally speaking each attendee
                    should make their own account.`}
                </InfoBlurb>

                {otherPurchases.length > 0 &&
                    <>
                        <Spacer size={32} />
                        <hr />
                        <Spacer size={32} />

                        <h2>
                            Other purchases
                        </h2>

                        <Spacer size={24} />

                        {otherPurchases.map(({ purchaseType, available }) =>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0' }} key={purchaseType.purchase_type_id}>
                                <div>
                                    {purchaseType.description} (${(purchaseType.price_in_cents / 100).toFixed(2)} each)
                                </div>

                                <Spacer size={24} />

                                <NumberInput
                                    value={purchaseFormState.otherPurchases[purchaseType.purchase_type_id] ?? 0}
                                    onChange={val => {
                                        if (val != null) {
                                            purchaseFormState.setOtherPurchasesCount(purchaseType.purchase_type_id, val)
                                        }
                                    }}
                                    style={{ width: 64 }}
                                    min={0}
                                    max={available}
                                />
                            </div>)}

                    </>}

                {store.purchasedTicketsByFestival[festival.festival_id]?.length === 0 && festival.festival_name === 'Vibeclipse 2024' && // HACK
                    <>
                        <Spacer size={32} />
                        <hr />
                        <Spacer size={32} />

                        <a
                            className='button primary'
                            href='https://admin.gazeboevents.com/forms/706B540F-AF67-4D4B-9C42-A402E51C2039'
                            target='_blank'
                            rel="noreferrer"
                            onMouseDown={purchaseFormState.handleWaiverClick} // Must be MouseDown and not Click to handle long-press on mobile
                        >
                            Campsite forms &nbsp; <Icon name='open_in_new' style={{ fontSize: 18 }} />
                        </a>

                        <Spacer size={4} />

                        <ErrorMessage error={purchaseFormState.showingErrors && purchaseFormState.hasClickedWaiverError} />

                        <Spacer size={8} />

                        <InfoBlurb>
                            {`Please click the link above to sign the campsite
                        waiver. Every attendee must sign this waiver. IF YOU HAVE
                        ALLERGIES OR SPECIAL DIETARY NEEDS (EG: vegetarian) you `}
                            <i>must</i>
                            {` also fill out the 'Retreat Special Diets Form' (Found at
                        this same page). If you do not fill out this special diets
                        form at least 3 weeks prior to vibeclipse we will not be
                        able to accommodate any special dietary needs.`}
                        </InfoBlurb>
                    </>}

                <Spacer size={32} />
                <hr />
                <Spacer size={32} />

                <Input
                    label='Discount code (optional)'
                    value={purchaseFormState.discountCode}
                    onChange={purchaseFormState.setDiscountCode}
                />

                <Spacer size={32} />
                <hr />
                <Spacer size={32} />

                <PriceBreakdown purchases={purchaseFormState.purchases} discountCode={purchaseFormState.discountCode} />

                <Spacer size={8} />

                <ErrorMessage error={purchaseFormState.numberOfAttendeesError} />

                <Spacer size={16} />

                <Button isSubmit isPrimary disabled={emptySelection}>
                    Proceed to payment
                </Button>
            </Col>
        </form>
    )
})
