
import React from 'react'

import { Tables } from '../../../../back-end/types/db-types'
import { observer, setTo } from '../../mobx/misc'
import { PurchaseForm } from '../../stores/PurchaseForm'
import Store from '../../stores/Store'
import { preventingDefault } from '../../utils'
import Button from '../core/Button'
import Col from '../core/Col'
import ErrorMessage from '../core/ErrorMessage'
import Icon from '../core/Icon'
import InfoBlurb from '../core/InfoBlurb'
import Spacer from '../core/Spacer'
import AttendeeInfoForm from './AttendeeInfoForm'
import BeddingField from './BeddingField'
import BusTicketsField from './BusTicketsField'
import PriceBreakdown from './PriceBreakdown'

type Props = {
    purchaseForm: PurchaseForm,
    goToNext: () => void,
    festival: Tables['festival'] | undefined
}

export default observer((props: Props) => {
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
                            isAccountHolder={index === 0}
                            showingErrors={props.purchaseForm.showingErrors}
                            festival={festival}
                        />

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

                <Spacer size={32} />
                <hr />
                <Spacer size={32} />

                {(props.purchaseForm.sleepingBagsToBuy > 0 || props.purchaseForm.pillowsToBuy > 0) &&
                    <>
                        <BeddingField purchaseForm={props.purchaseForm} />
                        <Spacer size={24} />
                    </>}

                {props.purchaseForm.busTicketsToBuy > 0 &&
                    <>
                        <BusTicketsField purchaseForm={props.purchaseForm} />
                        <Spacer size={24} />
                    </>}

                {Store.purchasedTickets.length === 0 &&
                    <>
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
                            {`Please click the link above to sign the Camp Champions
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

                <Button isSubmit isPrimary>
                    Proceed to payment
                </Button>
            </Col>
        </form>
    )
})
