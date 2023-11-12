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
        code: '',
        purchaseModalState: 'none' as 'none' | 'selection' | 'payment'
    })

    const closePurchaseModal = useStable(() => () => {
        state.purchaseModalState = 'none'
    })

    const openPurchaseModal = useStable(() => () => {
        state.purchaseModalState = 'selection'
    })

    const goToPayment = useStable(() => () => {
        purchaseFormState.activateAllValidation()

        if (purchaseFormState.isValid) {
            state.purchaseModalState = 'payment'
        }
    })

    const purchaseFormState = useStable(() => new PurchaseFormState())

    const submitInviteCode = useRequest(async () => {
        await vibefetch(Store.jwt, '/account/submit-invite-code', 'post', { invite_code: state.code })
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

    return (
        <Col padding={20} pageLevel justify={Store.accountInfo.state.kind !== 'result' ? 'center' : undefined} align={Store.accountInfo.state.kind !== 'result' ? 'center' : undefined}>
            {Store.accountInfo.state.kind === 'result' &&
                <h1 style={{ fontSize: 24 }}>My tickets</h1>}

            <Spacer size={Store.accountInfo.state.kind !== 'result' ? 300 : 24} />

            {awaitingPurchaseRecord || Store.accountInfo.state.kind === 'loading' ?
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
                                                <Ticket name={t.attendeeInfo?.name} ticketType={t.attendeeInfo == null ? undefined : t.attendeeInfo?.age_group === 'BETWEEN_18_AND_21' || t.attendeeInfo?.age_group === 'OVER_21' ? 'adult' : 'child'} />
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

            <Modal title='Ticket purchase' isOpen={state.purchaseModalState !== 'none'} onClose={closePurchaseModal}>
                {() =>
                    <MultiView
                        views={[
                            { name: 'selection', content: <SelectionView purchaseFormState={purchaseFormState} goToNext={goToPayment} /> },
                            { name: 'payment', content: <StripePaymentForm stripeOptions={stripeOptions.state.result} purchases={purchaseFormState.purchases} onPrePurchase={purchaseFormState.createAttendees.load} redirectUrl={location.origin + '#Tickets'} /> }
                        ]}
                        currentView={state.purchaseModalState}
                    />}
            </Modal>
        </Col>
    )
})

const SelectionView: FC<{ purchaseFormState: PurchaseFormState, goToNext: () => void }> = observer(({ purchaseFormState, goToNext }) => {
    const removeChildAttendee = useStable(() => createTransformer((index: number) => () => {
        purchaseFormState.childAttendees.splice(index, 1)
    }))

    return (
        <form onSubmit={preventingDefault(goToNext)}>
            <Col padding={20} pageLevel>

                <AttendeeInfoForm attendeeInfo={purchaseFormState.primaryAdultAttendee} isChild={false} isAccountHolder={true} />

                <Spacer size={32} />

                <hr />

                <Spacer size={32} />

                <Checkbox value={purchaseFormState.secondaryAdultAttendee != null} onChange={purchaseFormState.setBringingSecondary}>
                    {'I\'m bringing another adult with me'}
                </Checkbox>

                <Spacer size={12} />

                <InfoBlurb>
                    {`You can purchase a ticket for up to one other adult attendee
                    if you'd like. Their ticket and info will have to be managed
                    through your account here, but they'll otherwise be a full
                    attendee (with a badge and everything)`}
                </InfoBlurb>

                {purchaseFormState.secondaryAdultAttendee != null &&
                    <>
                        <Spacer size={24} />

                        <AttendeeInfoForm attendeeInfo={purchaseFormState.secondaryAdultAttendee} isChild={false} isAccountHolder={false} />
                    </>}

                <Spacer size={32} />

                <hr />

                <Spacer size={32} />

                {purchaseFormState.childAttendees.map((attendee, index) =>
                    <React.Fragment key={index}>
                        <AttendeeInfoForm attendeeInfo={attendee} isChild={true} isAccountHolder={false} />

                        <Spacer size={24} />

                        <Button isDanger onClick={removeChildAttendee(index)}>
                            Remove
                        </Button>

                        <Spacer size={32} />
                    </React.Fragment>)}

                <Button onClick={purchaseFormState.addChildAttendee} disabled={purchaseFormState.childAttendees.length >= 5}>
                    <span className="material-symbols-outlined" style={{ fontSize: 'inherit' }}>add</span>
                    <Spacer size={4} />
                    Add a minor
                </Button>

                {purchaseFormState.childAttendees.length === 5 &&
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
                    {`You are certainly welcome to drive directly to Camp 
                    Champions, but if you'd rather just get to AUS airport and 
                    leave the rest to us you can sign up for a bus slot for $60. 
                    When signing up, you will also pick a time slot for the 
                    trip TO camp. (All bus ticket tickets include a return trip 
                    to AUS airport leaving at 3:30 PM on Monday, April 8th)`}
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

                <ErrorMessage error={purchaseFormState.primaryAdultAttendee.fields.has_clicked_waiver.displayError} />

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
    ...[
        PURCHASE_TYPES_BY_TYPE.BUS_330PM_VIBECLIPSE_2024,
        PURCHASE_TYPES_BY_TYPE.BUS_430PM_VIBECLIPSE_2024,
        PURCHASE_TYPES_BY_TYPE.BUS_730PM_VIBECLIPSE_2024,
        PURCHASE_TYPES_BY_TYPE.BUS_830PM_VIBECLIPSE_2024
    ].map(r => ({
        value: r.purchase_type_id,
        label: `$${(r.price_in_cents / 100).toFixed(2)} - ${r.description}`
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
    age_group: null,
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

    primaryAdultAttendee = new Form({
        initialValues: { ...BLANK_ATTENDEE, is_primary_for_account: true, has_clicked_waiver: false },
        validators: attendeeValidators(false)
    })

    secondaryAdultAttendee: Form<AttendeeInfo & { has_clicked_waiver?: boolean }> | null = null

    childAttendees: Form<AttendeeInfo & { has_clicked_waiver?: boolean }>[] = []

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

    readonly handleWaiverClick = () => {
        this.primaryAdultAttendee.fields.has_clicked_waiver.set(true)
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
            && this.primaryAdultAttendee.fields.has_clicked_waiver.value === true
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

        await vibefetch(Store.jwt, '/purchase/create-attendees', 'post', this.allAttendeeForms.map(f => {
            const { has_clicked_waiver, ...values } = f.fieldValues
            return values
        }))
    }, { lazy: true })
}

const attendeeValidators = (isMinor: boolean): FormValidators<AttendeeInfo & { has_clicked_waiver?: boolean }> => ({
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
    },
    has_clicked_waiver: val => {
        if (val != null && val === false) {
            return 'Campsite waivers must be filled out for each attendee'
        }
    }
})