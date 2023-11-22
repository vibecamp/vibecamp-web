import { observer } from 'mobx-react-lite'
import { createTransformer } from 'mobx-utils'
import React from 'react'
import { fieldToProps } from '../../mobx/form'
import { useStable } from '../../mobx/hooks'
import { setter } from '../../mobx/misc'
import { preventingDefault } from '../../utils'
import Button from '../core/Button'
import Col from '../core/Col'
import ErrorMessage from '../core/ErrorMessage'
import InfoBlurb from '../core/InfoBlurb'
import Spacer from '../core/Spacer'
import AttendeeInfoForm from './AttendeeInfoForm'
import BeddingField from './BeddingField'
import BusTicketsField from './BusTicketsField'
import PriceBreakdown from './PriceBreakdown'
import { PurchaseFormState } from '../Tickets'

type Props = {
    purchaseFormState: PurchaseFormState,
    goToNext: () => void,
    readyToPay: boolean
}

export default observer(({ purchaseFormState, goToNext, readyToPay }: Props) => {
    const removeAttendee = useStable(() => createTransformer((index: number) => () => {
        purchaseFormState.additionalAttendees.splice(index, 1)
    }))

    return (
        <form onSubmit={preventingDefault(goToNext)}>
            <Col padding={20} pageLevel>

                <AttendeeInfoForm attendeeInfo={purchaseFormState.primaryAttendee} isChild={false} isAccountHolder={true} />

                <Spacer size={32} />
                <hr />
                <Spacer size={32} />

                {purchaseFormState.additionalAttendees.map((attendee, index) =>
                    <React.Fragment key={index}>
                        <AttendeeInfoForm attendeeInfo={attendee} isChild={true} isAccountHolder={false} />

                        <Spacer size={24} />

                        <Button isDanger onClick={removeAttendee(index)}>
                            Remove {attendee.fields.name.value || 'attendee'}
                        </Button>

                        <Spacer size={32} />
                    </React.Fragment>)}

                <Button onClick={purchaseFormState.addAttendee} disabled={purchaseFormState.allAttendeeForms.length === 6}>
                    <span className="material-symbols-outlined" style={{ fontSize: 'inherit' }}>add</span>
                    <Spacer size={4} />
                    Bring another attendee
                </Button>

                {purchaseFormState.allAttendeeForms.length === 6 &&
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

                <BeddingField
                    {...fieldToProps(purchaseFormState.extraPurchasesForm.fields.needsSleepingBags)}
                    needsPillow={purchaseFormState.extraPurchasesForm.fields.needsPillow.value}
                    onNeedsPillowChange={setter(purchaseFormState.extraPurchasesForm.fields.needsPillow, 'value')}
                    attendeeCount={purchaseFormState.allAttendeeForms.length}
                    showMessage
                />

                <Spacer size={24} />

                <BusTicketsField
                    {...fieldToProps(purchaseFormState.extraPurchasesForm.fields.needsBusTickets)}
                    showMessage
                />

                <Spacer size={24} />

                <a
                    className='button primary'
                    href='https://admin.gazeboevents.com/forms/706B540F-AF67-4D4B-9C42-A402E51C2039'
                    target='_blank'
                    rel="noreferrer"
                    onClick={purchaseFormState.handleWaiverClick}
                >
                    Campsite forms &nbsp; <span className='material-symbols-outlined' style={{ fontSize: 18 }}>open_in_new</span>
                </a>

                <Spacer size={4} />

                <ErrorMessage error={purchaseFormState.primaryAttendee.fields.has_clicked_waiver.displayError} />

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

                <Spacer size={32} />
                <hr />
                <Spacer size={32} />

                <PriceBreakdown purchases={purchaseFormState.purchases} />

                <Spacer size={8} />

                <ErrorMessage error={
                    purchaseFormState.adultAttendees.length > 2
                        ? 'Can only purchase two adult tickets per account'
                        : purchaseFormState.childAttendees.length > 5
                            ? 'Can only purchase five child tickets per account'
                            : undefined
                } />

                <Spacer size={16} />

                <Button isSubmit isPrimary disabled={!readyToPay}>
                    Proceed to payment
                </Button>
            </Col>
        </form>
    )
})
