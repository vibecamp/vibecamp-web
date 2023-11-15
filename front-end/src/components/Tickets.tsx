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
import { AttendeeInfo, Maybe, PURCHASE_TYPES_BY_TYPE, PurchaseType } from '../../../back-end/types/misc'
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
import { exists } from '../../../back-end/utils/misc'
import PriceBreakdown from './PriceBreakdown'
import RadioGroup from './core/RadioGroup'
import { Purchases } from '../../../back-end/types/route-types'
import { createTransformer } from 'mobx-utils'
import ErrorMessage from './core/ErrorMessage'
import WindowObservables from '../mobx/WindowObservables'

// HACK: When the purchase flow completes, the redirect may happen before the
// webhook has been triggered to record the purchases. To prevent confusion,
// if we've just returned to this screen after a payment, we wait a couple
// seconds then reload the page (assigning `location.search` reloads the page,
// and at the same time prevents subsequent reloads)
const awaitingPurchaseRecord = location.search.includes('payment_intent')
if (awaitingPurchaseRecord) {
    setTimeout(() => {
        location.search = ''
    }, 2000)
}

export default observer(() => {
    const state = useObservableState({
        code: ''
    })

    const closePurchaseModal = useStable(() => () => {
        WindowObservables.assignHashState({ purchaseModalState: 'none' })
    })

    const openPurchaseModal = useStable(() => () => {
        WindowObservables.assignHashState({ purchaseModalState: 'selection' })
    })

    const goToPayment = useStable(() => () => {
        purchaseFormState.activateAllValidation()

        if (purchaseFormState.isValid) {
            WindowObservables.assignHashState({ purchaseModalState: 'payment' })
        }
    })

    const purchaseFormState = useStable(() => new PurchaseFormState())

    const submitInviteCode = useRequest(async () => {
        const { status } = await vibefetch(Store.jwt, '/account/submit-invite-code', 'post', { invite_code: state.code })

        if (status === 404) {
            throw 'Invalid invite code'
        }

        if (status === 403) {
            throw 'This invite code has already been used'
        }

        if (status !== 200) {
            throw DEFAULT_FORM_ERROR
        }

        await Store.accountInfo.load()
    }, { lazy: true })

    const stripeOptions = useRequest(async () => {
        if (Store.loggedIn && Object.values(purchaseFormState.purchases).some(count => count > 0)) {
            const { response } = await vibefetch(
                Store.jwt,
                '/purchase/create-intent',
                'post',
                purchaseFormState.purchases
            )
            const { stripe_client_secret } = response ?? {}

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

    const loading = awaitingPurchaseRecord || Store.accountInfo.state.kind === 'loading'
    const loadingOrError = loading || Store.accountInfo.state.kind === 'error'

    return (
        <Col padding={20} pageLevel justify={loadingOrError ? 'center' : undefined} align={loadingOrError ? 'center' : undefined}>
            {Store.accountInfo.state.kind === 'result' &&
                <h1 style={{ fontSize: 24, alignSelf: 'flex-start' }}>
                    My tickets
                </h1>}

            <Spacer size={loadingOrError ? 300 : 24} />

            {loading ?
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

                                    {Store.purchasedTickets.map((t, index) => {
                                        return (
                                            <React.Fragment key={t.purchase_id}>
                                                {index > 0 &&
                                                    <Spacer size={24} />}
                                                <Ticket name={t.attendeeInfo?.name} ticketType={t.attendeeInfo == null ? undefined : t.attendeeInfo?.age != null && t.attendeeInfo.age >= 18 ? 'adult' : 'child'} />
                                            </React.Fragment>
                                        )
                                    })}

                                    {Store.purchasedTickets.length === 0 &&
                                        <Button isPrimary onClick={openPurchaseModal}>
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
                                                trust to allow them to buy tickets
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

                                        <ErrorMessage
                                            error={submitInviteCode.state.kind === 'error' ? (
                                                typeof submitInviteCode.state.error === 'string'
                                                    ? submitInviteCode.state.error
                                                    : DEFAULT_FORM_ERROR
                                            ) : undefined}
                                        />

                                        <Spacer size={8} />

                                        <Button isSubmit isPrimary isLoading={submitInviteCode.state.kind === 'loading'}>
                                            Enter invite code
                                        </Button>
                                    </Col>
                                </form>}
                        </>
                        : null}

            <Modal title='Ticket purchase' isOpen={WindowObservables.hashState?.purchaseModalState === 'selection' || WindowObservables.hashState?.purchaseModalState === 'payment'} onClose={closePurchaseModal}>
                {() =>
                    <MultiView
                        views={[
                            { name: 'selection', content: <SelectionView purchaseFormState={purchaseFormState} goToNext={goToPayment} readyToPay={stripeOptions.state.result != null} /> },
                            { name: 'payment', content: <StripePaymentForm stripeOptions={stripeOptions.state.result} purchases={purchaseFormState.purchases} onPrePurchase={purchaseFormState.createAttendees.load} redirectUrl={location.origin + '#%7B"currentView"%3A"Tickets"%7D'} /> }
                        ]}
                        currentView={WindowObservables.hashState?.purchaseModalState}
                    />}
            </Modal>
        </Col>
    )
})

const SelectionView: FC<{ purchaseFormState: PurchaseFormState, goToNext: () => void, readyToPay: boolean }> = observer(({ purchaseFormState, goToNext, readyToPay }) => {
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
                    {`Minors between age 2-18 will need their own tickets, but
                    those will live under your account. Children under two years
                    old do not need a ticket.`}
                </InfoBlurb>

                <Spacer size={32} />
                <hr />
                <Spacer size={32} />

                <RadioGroup
                    value={purchaseFormState.needsSleepingBags}
                    onChange={val => purchaseFormState.needsSleepingBags = val}
                    options={[
                        { value: true, label: `Yes, I would like to purchase ${purchaseFormState.allAttendeeForms.length === 1 ? 'a sleeping bag' : `${purchaseFormState.allAttendeeForms.length} sleeping bags`} ($${PURCHASE_TYPES_BY_TYPE.SLEEPING_BAG_VIBECLIPSE_2024.price_in_cents / 100} each)` },
                        { value: false, label: `No, ${purchaseFormState.allAttendeeForms.length === 1 ? 'I' : 'we'} will be bringing ${purchaseFormState.allAttendeeForms.length === 1 ? 'my' : 'our'} own bedding` },
                    ]}
                    error={
                        purchaseFormState.selectionValidationActive &&
                            purchaseFormState.needsSleepingBags === undefined
                            ? 'Please select an option'
                            : undefined
                    }
                />

                <Spacer size={16} />

                <Checkbox value={purchaseFormState.needsPillow} onChange={val => purchaseFormState.needsPillow = val}>
                    I would like {purchaseFormState.allAttendeeForms.length === 1 ? 'a pillow' : `${purchaseFormState.allAttendeeForms.length} pillows`} (${PURCHASE_TYPES_BY_TYPE.PILLOW_WITH_CASE_VIBECLIPSE_2024.price_in_cents / 100} each)
                </Checkbox>

                <Spacer size={16} />

                <InfoBlurb>
                    {`Camp Champions will have small (slightly smaller than 
                    twin), bare mattresses within the cabins. We recommend 
                    you pack along whatever bedding you'd be most 
                    comfortable with, but if for whatever reason you are 
                    unable to provide your own, we'll be offering 3-season 
                    sleeping bags for purchase. If you buy one and would prefer 
                    to donate it instead, we'll be making a donation run at the 
                    end of the event.`}
                </InfoBlurb>

                <Spacer size={24} />

                <RadioGroup
                    value={purchaseFormState.needsBusTickets}
                    onChange={val => purchaseFormState.needsBusTickets = val}
                    options={BUS_TICKET_OPTIONS}
                    error={
                        purchaseFormState.selectionValidationActive &&
                            purchaseFormState.needsBusTickets === undefined
                            ? 'Please select an option'
                            : undefined
                    }
                />

                <Spacer size={8} />

                <InfoBlurb>
                    {`Parking will be free at the event, but if you'd rather
                    get to AUS airport and leave the rest to us, you can sign
                    up for a bus seat for $60 round trip.`}&nbsp;
                    <b>All tickets include a return trip to AUS from Camp
                        Champions with a departure time of 3:30 pm, April 8th.</b>
                </InfoBlurb>

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
                    purchaseFormState.adultAttendees.length > PURCHASE_TYPES_BY_TYPE.ATTENDANCE_VIBECLIPSE_2024.max_per_account!
                        ? `Can only purchase ${PURCHASE_TYPES_BY_TYPE.ATTENDANCE_VIBECLIPSE_2024.max_per_account} adult tickets per account`
                    : purchaseFormState.childAttendees.length > PURCHASE_TYPES_BY_TYPE.ATTENDANCE_CHILD_VIBECLIPSE_2024.max_per_account!
                        ? `Can only purchase ${PURCHASE_TYPES_BY_TYPE.ATTENDANCE_CHILD_VIBECLIPSE_2024.max_per_account} child tickets per account`
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
    ...[
        PURCHASE_TYPES_BY_TYPE.BUS_330PM_VIBECLIPSE_2024,
        PURCHASE_TYPES_BY_TYPE.BUS_430PM_VIBECLIPSE_2024,
        PURCHASE_TYPES_BY_TYPE.BUS_730PM_VIBECLIPSE_2024,
        PURCHASE_TYPES_BY_TYPE.BUS_830PM_VIBECLIPSE_2024
    ].map(r => ({
        value: r.purchase_type_id,
        label: `$${(r.price_in_cents / 100).toFixed(2)} per attendee - ${r.description}`
    })),
    { value: null, label: 'No Cost - I\'ll get myself to camp, thanks!' },
]

const BLANK_ATTENDEE: Readonly<Omit<AttendeeInfo, 'is_primary_for_account'>> = {
    name: '',
    discord_handle: null,
    twitter_handle: null,
    interested_in_volunteering_as: null,
    interested_in_pre_call: false,
    planning_to_camp: false,
    age: null,
    medical_training: null,
    diet: null,
    has_allergy_milk: null,
    has_allergy_eggs: null,
    has_allergy_fish: null,
    has_allergy_shellfish: null,
    has_allergy_tree_nuts: null,
    has_allergy_peanuts: null,
    has_allergy_wheat: null,
    has_allergy_soy: null,
}

class PurchaseFormState {
    constructor() {
        makeAutoObservable(this)
    }

    primaryAttendee = new Form({
        initialValues: { ...BLANK_ATTENDEE, is_primary_for_account: true, has_clicked_waiver: false },
        validators: ATTENDEE_VALIDATORS
    })

    additionalAttendees: Form<AttendeeInfo & { has_clicked_waiver?: boolean }>[] = []

    needsSleepingBags: boolean | undefined = undefined
    needsPillow = false
    needsBusTickets: PurchaseType | null | undefined = undefined
    selectionValidationActive = false

    get allAttendeeForms() {
        return [
            this.primaryAttendee,
            ...this.additionalAttendees
        ].filter(exists)
    }

    readonly handleWaiverClick = () => {
        this.primaryAttendee.fields.has_clicked_waiver.set(true)
    }

    readonly addAttendee = () => {
        this.additionalAttendees.push(new Form({
            initialValues: { ...BLANK_ATTENDEE, is_primary_for_account: false as boolean },
            validators: ATTENDEE_VALIDATORS
        }))
    }

    readonly activateAllValidation = () => {
        this.allAttendeeForms.forEach(f => f.activateAllValidation())
        this.selectionValidationActive = true
    }

    get adultAttendees() {
        return this.allAttendeeForms.filter(a => a.fields.age.value == null || a.fields.age.value >= 18)
    }

    get childAttendees() {
        return this.allAttendeeForms.filter(a => a.fields.age.value != null && a.fields.age.value < 18)
    }

    get isValid() {
        return this.allAttendeeForms.every(a => a.isValid)
            && this.needsSleepingBags !== undefined
            && this.needsBusTickets !== undefined
            && this.primaryAttendee.fields.has_clicked_waiver.value === true
            && this.adultAttendees.length <= PURCHASE_TYPES_BY_TYPE.ATTENDANCE_VIBECLIPSE_2024.max_per_account!
            && this.childAttendees.length <= PURCHASE_TYPES_BY_TYPE.ATTENDANCE_CHILD_VIBECLIPSE_2024.max_per_account!
    }

    get purchases() {
        const purchases: Purchases = {
            ATTENDANCE_VIBECLIPSE_2024: this.adultAttendees.length,
            ATTENDANCE_CHILD_VIBECLIPSE_2024: this.childAttendees.length
        }

        if (this.needsSleepingBags) {
            purchases.SLEEPING_BAG_VIBECLIPSE_2024 = this.allAttendeeForms.length
        }

        if (this.needsPillow) {
            purchases.PILLOW_WITH_CASE_VIBECLIPSE_2024 = this.allAttendeeForms.length
        }

        if (this.needsBusTickets) {
            purchases[this.needsBusTickets] = this.allAttendeeForms.length
        }

        return purchases
    }

    readonly createAttendees = request(async () => {
        if (!this.isValid) {
            return
        }

        await vibefetch(Store.jwt, '/purchase/create-attendees', 'post', this.allAttendeeForms.map(f => {
            const { has_clicked_waiver, ...values } = f.fieldValues
            return values
        }))
    }, { lazy: true })
}

const ATTENDEE_VALIDATORS: FormValidators<AttendeeInfo & { has_clicked_waiver?: boolean }> = {
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
    age: val => {
        if (val == null) {
            return 'Please enter an age in years'
        }

        if (val < 0 || val > 150 || Math.floor(val) !== val) {
            return 'Please enter a valid age in years'
        }

        if (val < 2) {
            return 'Children under two get in free!'
        }
    },
    has_clicked_waiver: val => {
        if (val != null && val === false) {
            return 'Campsite waivers must be filled out for each attendee'
        }
    }
}