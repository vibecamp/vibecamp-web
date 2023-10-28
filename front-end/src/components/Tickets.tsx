/* eslint-disable indent */
import React, { FC, useCallback, useState } from 'react'
import { observer } from 'mobx-react-lite'
import Store from '../Store'
import Modal from './core/Modal'
import Ticket from './Ticket'
import Spacer from './core/Spacer'
import Input from './core/Input'
import Button from './core/Button'
import Col from './core/Col'
import { AttendeeInfo, Maybe, PURCHASE_TYPES_BY_TYPE, PurchaseType } from '../../../back-end/common/types'
import MultiView from './core/MultiView'
import { vibefetch } from '../vibefetch'

import StripePaymentForm from './core/StripePaymentForm'
import { useObservableState, useRequest, useStable } from '../mobx/hooks'
import { DEFAULT_FORM_ERROR, preventingDefault } from '../utils'
import LoadingDots from './core/LoadingDots'
import InfoBlurb from './core/InfoBlurb'
import Checkbox from './core/Checkbox'
import AttendeeInfoForm from './AttendeeInfoForm'
import { makeAutoObservable } from 'mobx'
import { Form, FormValidators } from '../mobx/form'
import { request } from '../mobx/request'
import { exists } from '../../../back-end/common/utils'
import { TABLE_ROWS } from '../../../back-end/db-types'
import PriceBreakdown from './PriceBreakdown'
import RadioGroup from './core/RadioGroup'
import { Purchases } from '../../../back-end/common/route-types'

export default observer(() => {
    const state = useObservableState({
        code: '',
        purchaseState: 'none' as 'none' | 'selection' | 'payment'
    })

    const purchaseState = useStable(() => new PurchaseFormState())

    const submitInviteCode = useRequest(async () => {
        await vibefetch(Store.jwt, '/account/submit-invite-code', 'post', { invite_code: state.code })
    }, { lazy: true })

    const stripeOptions = useRequest(async () => {
        if (Object.values(purchaseState.purchases).some(count => count > 0)) {
            const stripe_client_secret = (await vibefetch(
                Store.jwt,
                '/purchase/create-intent',
                'post',
                purchaseState.purchases
            ))?.stripe_client_secret

            if (stripe_client_secret == null) {
                return undefined
            }

            return {
                clientSecret: stripe_client_secret,
                appearance: {
                    theme: 'stripe' as const
                }
            }
        } else {
            return undefined
        }
    })

    function goToPayment() {
        purchaseState.activateAllValidation()

        if (purchaseState.isValid) {
            state.purchaseState = 'payment'
        }
    }

    return (
        <Col padding={20} pageLevel justify={Store.accountInfo.state.kind !== 'result' ? 'center' : undefined} align={Store.accountInfo.state.kind !== 'result' ? 'center' : undefined}>
            {Store.accountInfo.state.kind === 'result' &&
                <h1 style={{ fontSize: 24 }}>My tickets</h1>}

            <Spacer size={Store.accountInfo.state.kind !== 'result' ? 300 : 24} />

            {Store.accountInfo.state.kind === 'loading' ?
                <LoadingDots size={100} color='var(--color-accent-1)' />
                : Store.accountInfo.state.kind === 'error' || Store.accountInfo.state.result == null ?
                    'Failed to load'
                    : Store.accountInfo.state.kind === 'result' ?
                        <>
                            {Store.accountInfo.state.result.allowed_to_purchase
                                ? <>
                                    {Store.purchasedTickets.length === 0 &&
                                        <>
                                            <div style={{ textAlign: 'center' }}>
                                                {'(after you purchase tickets they\'ll show up here)'}
                                            </div>
                                            <Spacer size={32} />
                                        </>}

                                    {Store.purchasedTickets.map((p, index) => {
                                        // const attendee = Store.accountInfo.state.result?.attendees.find(a => a.attendee_id === p.assigned_to_attendee_id)
                                        // const ageGroup = TABLE_ROWS.age_group.find(a => a.age_group === attendee?.age_group)

                                        return (
                                            <React.Fragment key={p.purchase_id}>
                                                {index > 0 && 
                                                    <Spacer size={24} />}
                                                <Ticket name={undefined} ticketType={p.purchase_type_id === 'ATTENDANCE_CHILD_VIBECLIPSE_2024' ? 'child' : 'adult'} />
                                            </React.Fragment>
                                        )
                                    })}

                                    {Store.purchasedTickets.length === 0 &&
                                        <Button isPrimary onClick={() => state.purchaseState = 'selection'}>
                                            Buy tickets
                                        </Button>}

                                    <Spacer size={32} />

                                    {Store.accountInfo.state.result.inviteCodes.length > 0 &&
                                        <>
                                            <hr />

                                            <Spacer size={32} />

                                            <h2>
                                                Your invite codes
                                            </h2>

                                            <Spacer size={8} />

                                            <InfoBlurb>
                                                You can give these to other people you know and
                                                trust, to allow them to buy tickets
                                            </InfoBlurb>

                                            <Spacer size={16} />

                                            {Store.accountInfo.state.result.inviteCodes.map(({ code, used_by }, index) => <React.Fragment key={index}>
                                                {index > 0 && <Spacer size={8} />}

                                                <InviteCode code={code} usedBy={used_by} />
                                            </React.Fragment>)}
                                        </>}
                                </>
                                : <form onSubmit={preventingDefault(submitInviteCode.load)}>
                                    <Col>
                                        <h2>
                                            Welcome!
                                        </h2>

                                        <Spacer size={8} />

                                        <div>
                                            Someone else will need to refer you by giving
                                            you an invite code before you can buy tickets
                                            for the current event.
                                        </div>

                                        <Spacer size={24} />

                                        <Input
                                            label='Invite code'
                                            value={state.code}
                                            onChange={val => state.code = val}
                                        />

                                        {submitInviteCode.state.kind === 'error' &&
                                            <>
                                                <Spacer size={8} />

                                                <div style={{ color: 'red' }}>
                                                    {DEFAULT_FORM_ERROR}
                                                </div>
                                            </>}

                                        <Spacer size={8} />

                                        <Button isSubmit isPrimary isLoading={submitInviteCode.state.kind === 'loading'}>
                                            Enter invite code
                                        </Button>
                                    </Col>
                                </form>}
                        </>
                        : null}

            <Modal title='Ticket purchase' isOpen={state.purchaseState !== 'none'} onClose={() => state.purchaseState = 'none'}>
                {() =>
                    <MultiView
                        views={[
                            { name: 'selection', content: <SelectionView purchaseState={purchaseState} goToNext={goToPayment} /> },
                            { name: 'payment', content: <StripePaymentForm stripeOptions={stripeOptions.state.result} purchases={purchaseState.purchases} onPrePurchase={purchaseState.createAttendees.load} redirectUrl={location.origin + '#Tickets'} /> }
                        ]}
                        currentView={state.purchaseState}
                    />}
            </Modal>
        </Col>
    )
})

const SelectionView: FC<{ purchaseState: PurchaseFormState, goToNext: () => void }> = observer(({ purchaseState, goToNext }) => {

    return (
        <form onSubmit={preventingDefault(goToNext)}>
            <Col padding={20}>

                <AttendeeInfoForm attendeeInfo={purchaseState.primaryAdultAttendee} isChild={false} isAccountHolder={true} />

                <Spacer size={32} />

                <hr />

                <Spacer size={32} />

                <Checkbox value={purchaseState.secondaryAdultAttendee != null} onChange={purchaseState.setBringingSecondary}>
                    {'I\'m bringing another adult with me'}
                </Checkbox>

                <Spacer size={12} />

                <InfoBlurb>
                    {`You can purchase a ticket for up to one other adult attendee
                    if you'd like. Their ticket and info will have to be managed
                    through your account here, but they'll otherwise be a full
                    attendee (with a badge and everything)`}
                </InfoBlurb>

                {purchaseState.secondaryAdultAttendee != null &&
                    <>
                        <Spacer size={24} />

                        <AttendeeInfoForm attendeeInfo={purchaseState.secondaryAdultAttendee} isChild={false} isAccountHolder={false} />
                    </>}

                <Spacer size={32} />

                <hr />

                <Spacer size={32} />

                {purchaseState.childAttendees.map((attendee, index) =>
                    <React.Fragment key={index}>
                        <AttendeeInfoForm attendeeInfo={attendee} isChild={true} isAccountHolder={false} />

                        <Spacer size={24} />

                        <Button isDanger onClick={() => purchaseState.childAttendees.splice(index, 1)}>
                            Remove
                        </Button>

                        <Spacer size={32} />
                    </React.Fragment>)}

                <Button onClick={purchaseState.addChildAttendee} disabled={purchaseState.childAttendees.length >= 5}>
                    <span className="material-symbols-outlined" style={{ fontSize: 'inherit' }}>add</span>
                    <Spacer size={4} />
                    Add a minor
                </Button>

                {purchaseState.childAttendees.length === 5 &&
                    <>
                        <Spacer size={12} />

                        <InfoBlurb>
                            {'Can\'t buy tickets for more than five children on one account, sorry!'}
                        </InfoBlurb>
                    </>}

                <Spacer size={12} />

                <InfoBlurb>
                    {`Minors between age 2-18 will need their own tickets, but
                    those will live under your account. Children under two years
                    old do not need a ticket.`}
                </InfoBlurb>

                <Spacer size={32} />

                <hr />

                <Spacer size={32} />

                <RadioGroup
                    value={purchaseState.needsSleepingBags}
                    onChange={val => purchaseState.needsSleepingBags = val}
                    options={[
                        { value: true, label: `Yes, I would like to purchase ${purchaseState.allAttendeeForms.length === 1 ? 'a sleeping bag' : `${purchaseState.allAttendeeForms.length} sleeping bags`} ($${PURCHASE_TYPES_BY_TYPE.SLEEPING_BAG_VIBECLIPSE_2024.price_in_cents / 100} each)` },
                        { value: false, label: `No, ${purchaseState.allAttendeeForms.length === 1 ? 'I' : 'we'} will be bringing ${purchaseState.allAttendeeForms.length === 1 ? 'my' : 'our'} own bedding` },
                    ] }
                    error={
                        purchaseState.selectionValidationActive &&
                            purchaseState.needsSleepingBags === undefined
                                ? 'Please select an option'
                                : undefined
                    }
                />

                <Spacer size={16} />

                <Checkbox value={purchaseState.needsPillow} onChange={val => purchaseState.needsPillow = val}>
                    I would like {purchaseState.allAttendeeForms.length === 1 ? 'a pillow' : `${purchaseState.allAttendeeForms.length} pillows`} (${PURCHASE_TYPES_BY_TYPE.PILLOW_WITH_CASE_VIBECLIPSE_2024.price_in_cents / 100} each)
                </Checkbox>

                <Spacer size={24} />

                <InfoBlurb>
                    {`If you're staying in a cabin, Camp Champions provides 
                    only bare slightly-smaller-than-twin mattresses on the 
                    bunks, so we're each responsible for bringing our own 
                    bedding. Of course this is also true if you're camping. 
                    Would you like to arrange to rent bedding for the weekend? 
                    We'll be offering 3-season sleeping bags. The sleeping bags 
                    will be donated to homeless outreach after vibeclipse, but 
                    you're also welcome to keep them if you want.`}
                </InfoBlurb>

                <Spacer size={24} />

                <RadioGroup
                    value={purchaseState.needsBusTickets}
                    onChange={val => purchaseState.needsBusTickets = val}
                    options={BUS_TICKET_OPTIONS}
                    error={
                        purchaseState.selectionValidationActive &&
                            purchaseState.needsBusTickets === undefined
                                ? 'Please select an option'
                                : undefined
                    }
                />

                <Spacer size={8} />

                <InfoBlurb>
                    {`You are certainly welcome to drive directly to Camp 
                    Champions, but if you'd rather just get to AUS airport and 
                    leave the rest to us you can sign up for a bus slot for $60. 
                    When signing up, you will also pick a time slot for the 
                    trip TO camp. (All bus ticket tickets include a return trip 
                    to AUS airport leaving at 3:30 PM on Monday, April 8th)`}
                </InfoBlurb>

                <Spacer size={32} />

                <hr />

                <Spacer size={32} />

                <PriceBreakdown purchases={purchaseState.purchases} />

                <Spacer size={24} />

                <Button isSubmit isPrimary>
                    Purchase
                </Button>
            </Col>
        </form>
    )
})

const InviteCode: FC<{ code: string, usedBy: Maybe<string> }> = observer(({ code, usedBy }) => {
    const [copied, setCopied] = useState(false)

    const copy = useCallback(async () => {
        await navigator.clipboard.writeText(code)
        setCopied(true)
    }, [code])

    return (
        <div className={'invite-code' + ' ' + (usedBy != null ? 'used' : '')}>
            <div className='code-widget'>
                <div className='code'>
                    {code}
                </div>

                <button onClick={copy}>
                    {copied
                        ? <span className="material-symbols-outlined">check</span>
                        : <span className="material-symbols-outlined">content_copy</span>}
                </button>
            </div>


            <div className='used-by'>
                {usedBy != null && `Used by ${usedBy}`}
            </div>
        </div>
    )
})

const BUS_TICKET_OPTIONS = [
    { value: null, label: 'No Cost - I\'ll get myself to camp, thanks!' },
    ...[
        PURCHASE_TYPES_BY_TYPE.BUS_330PM_VIBECLIPSE_2024,
        PURCHASE_TYPES_BY_TYPE.BUS_430PM_VIBECLIPSE_2024,
        PURCHASE_TYPES_BY_TYPE.BUS_730PM_VIBECLIPSE_2024,
        PURCHASE_TYPES_BY_TYPE.BUS_830PM_VIBECLIPSE_2024
    ].map(r => ({
        value: r.purchase_type_id,
        label: `$${(r.price_in_cents / 100).toFixed(2)} - ${r.description}`
    }))
]

const BLANK_ATTENDEE: Readonly<Omit<AttendeeInfo, 'is_primary_for_account'>> = {
    name: '',
    discord_handle: null,
    twitter_handle: null,
    interested_in_volunteering_as: null,
    interested_in_pre_call: false,
    planning_to_camp: false,
    age_group: null,
    medical_training: null,
    special_diet: null,
    has_allergy_milk: false,
    has_allergy_eggs: false,
    has_allergy_fish: false,
    has_allergy_shellfish: false,
    has_allergy_tree_nuts: false,
    has_allergy_peanuts: false,
    has_allergy_wheat: false,
    has_allergy_soy: false,
}

class PurchaseFormState {
    constructor() {
        makeAutoObservable(this)
    }

    primaryAdultAttendee = new Form({
        initialValues: { ...BLANK_ATTENDEE, is_primary_for_account: true },
        validators: attendeeValidators(false)
    })

    secondaryAdultAttendee: Form<AttendeeInfo> | null = null

    childAttendees: Form<AttendeeInfo>[] = []

    needsSleepingBags: boolean | undefined = undefined
    needsPillow = false
    needsBusTickets: PurchaseType | null | undefined = undefined
    selectionValidationActive = false

    get allAttendeeForms() {
        return [
            this.primaryAdultAttendee,
            this.secondaryAdultAttendee,
            ...this.childAttendees
        ].filter(exists)
    }

    readonly setBringingSecondary = (bringing: boolean) => {
        if (bringing) {
            this.secondaryAdultAttendee = new Form({
                initialValues: { ...BLANK_ATTENDEE, is_primary_for_account: false as boolean },
                validators: attendeeValidators(false)
            })
        } else {
            this.secondaryAdultAttendee = null
        }
    }

    readonly addChildAttendee = () => {
        this.childAttendees.push(new Form({
            initialValues: { ...BLANK_ATTENDEE, is_primary_for_account: false as boolean },
            validators: attendeeValidators(true)
        }))
    }

    readonly activateAllValidation = () => {
        this.allAttendeeForms.forEach(f => f.activateAllValidation())
        this.selectionValidationActive = true
    }

    get isValid() {
        return this.allAttendeeForms.every(f => f.isValid)
            && this.needsSleepingBags !== undefined
            && this.needsBusTickets !== undefined
            && this.childAttendees.every(a => a.fields.age_group.value !== 'UNDER_2')
    }

    get purchases() {
        const p: Purchases = {
            ATTENDANCE_VIBECLIPSE_2024: this.secondaryAdultAttendee == null ? 1 : 2,
            ATTENDANCE_CHILD_VIBECLIPSE_2024: this.childAttendees.length
        }

        if (this.needsSleepingBags) {
            p.SLEEPING_BAG_VIBECLIPSE_2024 = this.allAttendeeForms.length
        }

        if (this.needsPillow) {
            p.PILLOW_WITH_CASE_VIBECLIPSE_2024 = this.allAttendeeForms.length
        }

        if (this.needsBusTickets) {
            p[this.needsBusTickets] = this.allAttendeeForms.length
        }

        return p
    }

    readonly createAttendees = request(async () => {
        if (!this.isValid) {
            return
        }

        await vibefetch(Store.jwt, '/purchase/create-attendees', 'post', this.allAttendeeForms.map(f => f.fieldValues))
    }, { lazy: true })
}

const attendeeValidators = (isMinor: boolean): FormValidators<AttendeeInfo> => ({
    name: val => {
        if (val === '') {
            return 'Please enter a name'
        }
    },
    twitter_handle: val => {
        if (val?.startsWith('@')) {
            return 'No @ needed, just the rest of the handle'
        }
    },
    age_group: val => {
        if (val == null) {
            return 'Please select an age group'
        }
        if (isMinor && val === 'UNDER_2') {
            return 'Children under two get in free! If you need to remove this attendee entry, there\'s a red button at the bottom'
        }
    }
})