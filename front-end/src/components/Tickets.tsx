import React, { } from 'react'
import { observer } from 'mobx-react-lite'
import Store from '../Store'
import Modal from './core/Modal'
import Ticket from './tickets/Ticket'
import Spacer from './core/Spacer'
import Button from './core/Button'
import Col from './core/Col'
import { AttendeeInfo, Maybe, PurchaseType } from '../../../back-end/types/misc'
import MultiView from './core/MultiView'
import { vibefetch } from '../vibefetch'

import StripePaymentForm from './core/StripePaymentForm'
import { useAutorun, useObservableClass, useRequest, useStable } from '../mobx/hooks'
import LoadingDots from './core/LoadingDots'
import { request } from '../mobx/request'
import { Purchases } from '../../../back-end/types/route-types'
import WindowObservables from '../mobx/WindowObservables'
import SelectionView from './tickets/SelectionView'
import InviteCodes from './tickets/InviteCodes'
import InviteCodeEntryForm from './tickets/InviteCodeEntryForm'
import { objectValues } from '../../../back-end/utils/misc'
import Application from './Application'

export default observer(() => {
    const goToTicketPayment = useStable(() => () => {
        ticketPurchaseFormState.showingErrors = true

        if (ticketPurchaseFormState.isValid) {
            WindowObservables.assignHashState({ ticketPurchaseModalState: 'payment' })
        }
    })

    const ticketPurchaseFormState = useObservableClass(PurchaseFormState)

    const stripeOptions = useRequest(async () => {
        if (Store.loggedIn && ticketPurchaseFormState.isValid && Object.values(ticketPurchaseFormState.purchases).some(count => count > 0)) {
            const { body: response } = await vibefetch(
                Store.jwt,
                '/purchase/create-intent',
                'post',
                ticketPurchaseFormState.purchases
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


    const handlePurchaseCompletion = useStable(() => async () => {
        WindowObservables.assignHashState({ currentView: 'Tickets', ticketPurchaseModalState: 'none', busPurchaseModalState: 'none', beddingPurchaseModalState: 'none' })

        // HACK: When the purchase flow completes, the webhook will take an
        // indeterminate amount of time to record the purchases. So, we wait a couple
        // seconds before refreshing the list, which should usually be enough
        setTimeout(Store.accountInfo.load, 2000)
    })

    const loading = Store.accountInfo.state.kind === 'loading'
    const loadingOrError = loading || Store.accountInfo.state.kind === 'error'

    useAutorun(() => {
        if (WindowObservables.hashState?.ticketPurchaseModalState === 'payment' && stripeOptions.state.kind === 'result' && stripeOptions.state.result == null) {
            WindowObservables.assignHashState({ ticketPurchaseModalState: 'selection' })
        }
    })

    const { application_status } = Store.accountInfo.state.result ?? {}

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

                                    {Store.purchasedTickets.map(t => {
                                        return (
                                            <React.Fragment key={t.purchase_id}>
                                                <Ticket name={t.attendeeInfo?.name} ticketType={t.attendeeInfo == null ? undefined : needsAdultTicket(t.attendeeInfo?.age) ? 'adult' : 'child'} />
                                                <Spacer size={24} />
                                            </React.Fragment>
                                        )
                                    })}

                                    <Button isPrimary onClick={openTicketPurchaseModal}>
                                        {Store.purchasedTickets.length === 0
                                            ? 'Buy tickets'
                                            : 'Buy more tickets or bus/bedding'}
                                    </Button>

                                    <Spacer size={32} />

                                    <InviteCodes />
                                </>
                                : <>
                                    <InviteCodeEntryForm />

                                    <Spacer size={48} />

                                    <div>
                                        {`Alternately, you can apply for
                                        admission to the event. The team will
                                        review your submission and may invite
                                        you directly.`}
                                    </div>

                                    <Spacer size={24} />


                                    <Button isPrimary disabled={application_status !== 'unsubmitted'} onClick={openApplicationModal}>
                                        {application_status === 'pending'
                                            ? 'Your application is under review!'
                                            : application_status === 'rejected'
                                                ? 'Application denied :('
                                                : `Apply to ${Store.festival.state.result?.festival_name}`}
                                    </Button>

                                </>}

                            {Store.festival.state.result?.info_url &&
                                <>

                                    <Spacer size={32} />
                                    <hr />
                                    <Spacer size={32} />

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

            <Modal
                title='Ticket purchase'
                isOpen={WindowObservables.hashState?.ticketPurchaseModalState === 'selection' || WindowObservables.hashState?.ticketPurchaseModalState === 'payment'}
                onClose={closeTicketPurchaseModal}
            >
                <MultiView
                    views={[
                        {
                            name: 'selection', content:
                                <SelectionView
                                    purchaseFormState={ticketPurchaseFormState}
                                    goToNext={goToTicketPayment}
                                />
                        },
                        {
                            name: 'payment', content:
                                <StripePaymentForm
                                    stripeOptions={stripeOptions.state.result}
                                    purchases={ticketPurchaseFormState.purchases}
                                    onPrePurchase={ticketPurchaseFormState.createAttendees.load}
                                    onCompletePurchase={handlePurchaseCompletion}
                                />
                        }
                    ]}
                    currentView={WindowObservables.hashState?.ticketPurchaseModalState}
                />
            </Modal>

            <Modal
                title={`Apply to ${Store.festival.state.result?.festival_name}`}
                isOpen={WindowObservables.hashState?.applicationModalOpen === true}
                onClose={closeApplicationModal}
            >
                <Application onSuccess={handleApplicationSubmissionSuccess} />
            </Modal>
        </Col>
    )
})

const closeTicketPurchaseModal = () => {
    WindowObservables.assignHashState({ ticketPurchaseModalState: 'none' })
}

const openTicketPurchaseModal = () => {
    WindowObservables.assignHashState({ ticketPurchaseModalState: 'selection' })
}

const closeApplicationModal = () => {
    WindowObservables.assignHashState({ applicationModalOpen: false })
}

const handleApplicationSubmissionSuccess = () => {
    closeApplicationModal()
    void Store.accountInfo.load()
}

const openApplicationModal = () => {
    WindowObservables.assignHashState({ applicationModalOpen: true })
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
    attendees: AttendeeInfo[] = [
        { ...BLANK_ATTENDEE, is_primary_for_account: true }
    ]

    needsSleepingBags: boolean | undefined = undefined
    needsPillow = false
    needsBusTickets: Maybe<PurchaseType> = undefined
    hasClickedWaiver = false

    showingErrors = false

    get adultAttendees() {
        return this.attendees.filter(a => needsAdultTicket(a.age))
    }
    get childAttendees() {
        return this.attendees.filter(a => doesntNeedAdultTicket(a.age))
    }
    get numberOfAttendeesError() {
        if (this.adultAttendees.length > 2) {
            return 'Can only purchase two adult tickets per account'
        }
        if (this.childAttendees.length > 5) {
            return 'Can only purchase five child tickets per account'
        }
    }

    get attendeeErrors() {
        return this.attendees.map(getAttendeeErrors)
    }
    get needsSleepingBagsError() {
        if (this.needsSleepingBags == null) {
            return 'Please make a selection'
        }
    }
    get needsBusTicketsError() {
        if (this.needsBusTickets === undefined) {
            return 'Please make a selection'
        }
    }
    get hasClickedWaiverError() {
        if (!this.hasClickedWaiver) {
            return 'Campsite waivers must be filled out'
        }
    }

    get isValid() {
        return this.attendeeErrors.every(errors => objectValues(errors).every(err => err == null))
            && this.numberOfAttendeesError == null
            && this.needsSleepingBagsError == null
            && this.needsBusTicketsError == null
            && this.hasClickedWaiverError == null
    }
    get purchases(): Purchases {
        const purchases: Purchases = {}

        for (const attendee of this.attendees) {
            const ticketType = purchaseTypeFromAge(attendee.age)
            if (ticketType) {
                purchases[ticketType] = (purchases[ticketType] ?? 0) + 1
            }
        }

        if (this.needsSleepingBags) {
            purchases.SLEEPING_BAG_VIBECLIPSE_2024 = this.attendees.length
        }

        if (this.needsPillow) {
            purchases.PILLOW_WITH_CASE_VIBECLIPSE_2024 = this.attendees.length
        }

        if (this.needsBusTickets) {
            purchases[this.needsBusTickets] = this.attendees.length
        }

        return purchases
    }

    readonly addAttendee = () => {
        this.attendees.push({ ...BLANK_ATTENDEE, is_primary_for_account: false })
    }

    readonly createAttendees = request(async () => {
        if (!this.isValid) {
            return
        }

        await vibefetch(Store.jwt, '/purchase/create-attendees', 'post', this.attendees)
    }, { lazy: true })
}

function getAttendeeErrors(attendee: AttendeeInfo): Partial<Record<keyof AttendeeInfo, string>> {
    const errors: Partial<Record<keyof AttendeeInfo, string>> = {}

    if (attendee.name === '') {
        errors.name = 'Please enter a name'
    }

    if (attendee.twitter_handle?.startsWith('@')) {
        errors.twitter_handle = 'No @ needed, just the rest of the handle'
    }

    if (attendee.age == null) {
        errors.age = 'Please enter an age in years'
    } else if (attendee.age < 0 || attendee.age > 150 || Math.floor(attendee.age) !== attendee.age) {
        errors.age = 'Please enter a valid age in years'
    } else if (attendee.age < 2) {
        errors.age = 'Children under two get in free!'
    }

    return errors
}

const needsAdultTicket = (age: number | null) => age == null || age >= 16
const doesntNeedAdultTicket = (age: number | null) => !needsAdultTicket(age)

const purchaseTypeFromAge = (age: number | null): PurchaseType | undefined => {
    if (needsAdultTicket(age)) {
        return 'ATTENDANCE_VIBECLIPSE_2024_OVER_16'
    }
    if (age! < 2) {
        return undefined
    }
    if (age! < 5) {
        return 'ATTENDANCE_VIBECLIPSE_2024_2_TO_5'
    }
    if (age! < 10) {
        return 'ATTENDANCE_VIBECLIPSE_2024_5_TO_10'
    }
    if (age! < 16) {
        return 'ATTENDANCE_VIBECLIPSE_2024_10_TO_16'
    }
}
