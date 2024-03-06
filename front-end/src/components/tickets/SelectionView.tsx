import React from 'react'

import { TABLE_ROWS, Tables } from '../../../../back-end/types/db-types'
import { useObservableClass } from '../../mobx/hooks'
import { observer, setter, setTo } from '../../mobx/misc'
import { PurchaseForm } from '../../stores/PurchaseForm'
import Store from '../../stores/Store'
import { preventingDefault, someValue } from '../../utils'
import Button from '../core/Button'
import Col from '../core/Col'
import ErrorMessage from '../core/ErrorMessage'
import Icon from '../core/Icon'
import InfoBlurb from '../core/InfoBlurb'
import NumberInput from '../core/NumberInput'
import RadioGroup from '../core/RadioGroup'
import Spacer from '../core/Spacer'
import AttendeeInfoForm from './AttendeeInfoForm'
import PriceBreakdown from './PriceBreakdown'

type Props = {
    purchaseForm: PurchaseForm,
    goToNext: () => void,
    festival: Tables['festival'] | undefined
}

export default observer((props: Props) => {
    const state = useObservableClass(class {
        get festivalPurchases() {
            return TABLE_ROWS.purchase_type
                .filter(t =>
                    t.festival_id === props.festival?.festival_id)
                .sort((a, b) => b.price_in_cents - a.price_in_cents)
        }

        get attendancePurchases() {
            return this.festivalPurchases.filter(t => t.is_attendance_ticket)
        }

        get otherPurchases() {
            return this.festivalPurchases.filter(t => !t.is_attendance_ticket).sort((a, b) => a.description.localeCompare(b.description))
        }

        get attendancePurchaseOptions() {
            return this.attendancePurchases.map(p => ({ label: `${p.description} ($${p.price_in_cents / 100})`, value: p.purchase_type_id }))
        }

        get emptySelection() {
            return !someValue(props.purchaseForm.purchases, v => v != null && v > 0)
        }
    })

    const { festival } = props
    if (festival == null) {
        return null
    }

    return (
        <form onSubmit={preventingDefault(props.goToNext)} noValidate>
            <Col padding={20} pageLevel>

                {props.purchaseForm.attendees.map((attendee, index) =>
                    <React.Fragment key={index}>

                        {index > 0 && <>
                            <Spacer size={32} />
                            <hr />
                            <Spacer size={32} />
                        </>}

                        <AttendeeInfoForm
                            attendeeInfo={attendee}
                            attendeeErrors={props.purchaseForm.attendeeErrors[index]!}
                            isChild={attendee.age != null && attendee.age < 18}
                            showingErrors={props.purchaseForm.showingErrors}
                            festival={festival}
                        />

                        <Spacer size={24} />

                        <RadioGroup
                            label='Ticket type for this person'
                            options={state.attendancePurchaseOptions}
                            value={attendee.ticket_type}
                            onChange={setter(attendee, 'ticket_type')}
                            error={props.purchaseForm.showingErrors && props.purchaseForm.attendeeErrors[index]?.ticket_type}
                        />

                        <Spacer size={24} />

                        {index > 0 &&
                            <>
                                <Spacer size={24} />

                                <Button isDanger onClick={props.purchaseForm.removeAttendee(index)}>
                                    Remove {attendee.name || 'attendee'}
                                </Button>
                            </>}

                        <Spacer size={32} />
                    </React.Fragment>)}

                <Button onClick={props.purchaseForm.addAttendee} disabled={props.purchaseForm.attendees.length === 6}>
                    <Icon name='add' style={{ fontSize: 'inherit' }} />
                    <Spacer size={4} />
                    Bring another attendee
                </Button>

                {props.purchaseForm.attendees.length === 6 &&
                    <>
                        <Spacer size={12} />

                        <InfoBlurb>
                            {'Ticket limit for one account reached'}
                        </InfoBlurb>
                    </>}

                <Spacer size={12} />

                <InfoBlurb>
                    {`You can purchase a ticket for up to one other adult attendee
                    if you'd like. Their ticket and info will have to be managed
                    through your account here, but they'll otherwise be a full
                    attendee (with a badge and everything). You can purchase
                    additional tickets for up to four minors.`}
                    <Spacer size={4} />
                    {`Minors over two will need their own tickets, but
                    those will live under your account. Children under two years
                    old do not need a ticket.`}
                </InfoBlurb>

                {state.otherPurchases.length > 0 &&
                    <>
                        <Spacer size={32} />
                        <hr />
                        <Spacer size={32} />

                        <h2>
                            Other purchases
                        </h2>

                        <Spacer size={24} />

                        {state.otherPurchases.map(p =>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0' }} key={p.purchase_type_id}>
                                <div>
                                    {p.description} (${(p.price_in_cents / 100).toFixed(2)} each)
                                </div>

                                <Spacer size={24} />

                                <NumberInput
                                    value={props.purchaseForm.otherPurchases[p.purchase_type_id] ?? 0}
                                    onChange={val => props.purchaseForm.otherPurchases[p.purchase_type_id] = val ?? undefined}
                                    style={{ width: 64 }}
                                    min={0}
                                    max={p.max_per_account ?? undefined}
                                />
                            </div>)}

                    </>}

                {Store.purchasedTickets[festival.festival_id].length === 0 && festival.festival_name === 'Vibeclipse 2024' && // HACK
                    <>
                        <Spacer size={32} />
                        <hr />
                        <Spacer size={32} />

                        <a
                            className='button primary'
                            href='https://admin.gazeboevents.com/forms/706B540F-AF67-4D4B-9C42-A402E51C2039'
                            target='_blank'
                            rel="noreferrer"
                            onMouseDown={setTo(props.purchaseForm, 'hasClickedWaiver', true)} // Must be MouseDown and not Click to handle long-press on mobile
                        >
                            Campsite forms &nbsp; <Icon name='open_in_new' style={{ fontSize: 18 }} />
                        </a>

                        <Spacer size={4} />

                        <ErrorMessage error={props.purchaseForm.showingErrors && props.purchaseForm.hasClickedWaiverError} />

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

                <PriceBreakdown purchases={props.purchaseForm.purchases} />

                <Spacer size={8} />

                <ErrorMessage error={props.purchaseForm.numberOfAttendeesError} />

                <Spacer size={16} />

                <Button isSubmit isPrimary disabled={state.emptySelection}>
                    Proceed to payment
                </Button>
            </Col>
        </form>
    )
})
