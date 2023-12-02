/* eslint-disable indent */
import React, { } from 'react'
import { observer } from 'mobx-react-lite'
import Store from '../Store'
import Modal from './core/Modal'
import Ticket from './tickets/Ticket'
import Spacer from './core/Spacer'
import Button from './core/Button'
import Col from './core/Col'
import { AttendeeInfo, PurchaseType } from '../../../back-end/types/misc'
import MultiView from './core/MultiView'
import { vibefetch } from '../vibefetch'

import StripePaymentForm from './core/StripePaymentForm'
import { useRequest, useStable } from '../mobx/hooks'
import LoadingDots from './core/LoadingDots'
import { makeAutoObservable } from 'mobx'
import { Form, FormValidators } from '../mobx/form'
import { request } from '../mobx/request'
import { Purchases } from '../../../back-end/types/route-types'
import WindowObservables from '../mobx/WindowObservables'
import SelectionView from './tickets/SelectionView'
import InviteCodes from './tickets/InviteCodes'
import InviteCodeEntryForm from './tickets/InviteCodeEntryForm'


export default observer(() => {
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

    const stripeOptions = useRequest(async () => {
        if (Store.loggedIn && purchaseFormState.isValid && Object.values(purchaseFormState.purchases).some(count => count > 0)) {
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

    const loading = Store.accountInfo.state.kind === 'loading'
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
                                                <Ticket name={t.attendeeInfo?.name} ticketType={t.attendeeInfo == null ? undefined : t.attendeeInfo?.age != null && t.attendeeInfo.age >= 16 ? 'adult' : 'child'} />
                                            </React.Fragment>
                                        )
                                    })}

                                    {Store.purchasedTickets.length === 0
                                        ? <Button isPrimary onClick={openPurchaseModal}>
                                              Buy tickets
                                          </Button>
                                        : <Button isPrimary onClick={openPurchaseModal}>
                                              Buy bus tickets or bedding
                                          </Button>}

                                    <Spacer size={32} />

                                    <InviteCodes />
                                </>
                                : <InviteCodeEntryForm />}

                            {Store.festival.state.result?.info_url &&
                                <>
                                    <Spacer size={24} />

                                    <a
                                        className='button primary'
                                        href={Store.festival.state.result.info_url}
                                        target='_blank'
                                        rel="noreferrer"
                                    >
                                        Info about {Store.festival.state.result.festival_name} &nbsp; <span className='material-symbols-outlined' style={{ fontSize: 18 }}>open_in_new</span>
                                    </a>
                                </>}
                        </>
                        : null}

            <Modal title='Ticket purchase' isOpen={WindowObservables.hashState?.purchaseModalState === 'selection' || WindowObservables.hashState?.purchaseModalState === 'payment'} onClose={closePurchaseModal}>
                {() =>
                    <MultiView
                        views={[
                            { name: 'selection', content: <SelectionView purchaseFormState={purchaseFormState} goToNext={goToPayment} readyToPay={stripeOptions.state.result != null} /> },
                            { name: 'payment', content: <StripePaymentForm stripeOptions={stripeOptions.state.result} purchases={purchaseFormState.purchases} onPrePurchase={purchaseFormState.createAttendees.load} onCompletePurchase={showTickets} /> }
                        ]}
                        currentView={WindowObservables.hashState?.purchaseModalState}
                    />}
            </Modal>
        </Col>
    )
})

const showTickets = () => {
    Store.accountInfo.load()
    WindowObservables.assignHashState({ currentView: 'Tickets', purchaseModalState: 'none' })

    // HACK: When the purchase flow completes, the webhook will take an
    // indeterminate amount of time to record the purchases. So, we wait a couple
    // seconds before refreshing the list, which should usually be enough
    setTimeout(() => {
        Store.accountInfo.load()
    }, 2000)

}

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

export class PurchaseFormState {
    constructor() {
        makeAutoObservable(this)
    }

    readonly primaryAttendee = new Form({
        initialValues: {
            ...BLANK_ATTENDEE,
            is_primary_for_account: true,
            has_clicked_waiver: false
        },
        validators: ATTENDEE_VALIDATORS
    })

    readonly additionalAttendees: Form<AttendeeInfo & { has_clicked_waiver?: boolean }>[] = []

    readonly extraPurchasesForm = createExtraPurchasesForm()

    get allAttendeeForms() {
        return [
            this.primaryAttendee,
            ...this.additionalAttendees
        ]
    }

    readonly handleWaiverClick = () => {
        this.primaryAttendee.fields.has_clicked_waiver.value = true
    }

    readonly addAttendee = () => {
        this.additionalAttendees.push(new Form({
            initialValues: { ...BLANK_ATTENDEE, is_primary_for_account: false as boolean },
            validators: ATTENDEE_VALIDATORS
        }))
    }

    readonly activateAllValidation = () => {
        this.allAttendeeForms.forEach(f => f.activateAllValidation())
        this.extraPurchasesForm.activateAllValidation()
    }

    get adultAttendees() {
        return this.allAttendeeForms.filter(a => a.fields.age.value == null || a.fields.age.value >= 16)
    }

    get childAttendees() {
        return this.allAttendeeForms.filter(a => a.fields.age.value != null && a.fields.age.value < 16)
    }

    get isValid() {
        return this.allAttendeeForms.every(a => a.isValid)
            && this.extraPurchasesForm.isValid
            && this.primaryAttendee.fields.has_clicked_waiver.value === true
            && this.adultAttendees.length <= 2
            && this.childAttendees.length <= 5
    }

    get purchases() {
        const purchases: Purchases = {}

        for (const attendee of this.allAttendeeForms) {
            const ticketType = purchaseTypeFromAge(attendee.fields.age.value)
            if (ticketType) {
                purchases[ticketType] = (purchases[ticketType] ?? 0) + 1
            }
        }

        const {needsSleepingBags, needsPillow, needsBusTickets} = this.extraPurchasesForm.fieldValues

        if (needsSleepingBags) {
            purchases.SLEEPING_BAG_VIBECLIPSE_2024 = this.allAttendeeForms.length
        }

        if (needsPillow) {
            purchases.PILLOW_WITH_CASE_VIBECLIPSE_2024 = this.allAttendeeForms.length
        }

        if (needsBusTickets) {
            purchases[needsBusTickets] = this.allAttendeeForms.length
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

const createExtraPurchasesForm = () => new Form({
    initialValues: {
        needsSleepingBags: undefined as boolean | undefined,
        needsPillow: false,
        needsBusTickets: undefined as PurchaseType | null | undefined
    },
    validators: {
        needsSleepingBags: val => {
            if (val == null) {
                return 'Please make a selection'
            }
        },
        needsBusTickets: val => {
            if (val === undefined) {
                return 'Please make a selection'
            }
        }
    }
})

const purchaseTypeFromAge = (age: number | null): PurchaseType | undefined => {
    if (age == null) {
        return 'ATTENDANCE_VIBECLIPSE_2024_OVER_16'
    }

    if (age < 2) {
        return undefined
    }
    if (age < 5) {
        return 'ATTENDANCE_VIBECLIPSE_2024_2_TO_5'
    }
    if (age < 10) {
        return 'ATTENDANCE_VIBECLIPSE_2024_5_TO_10'
    }
    if (age < 16) {
        return 'ATTENDANCE_VIBECLIPSE_2024_10_TO_16'
    }

    return 'ATTENDANCE_VIBECLIPSE_2024_OVER_16'
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