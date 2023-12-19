import { createTransformer } from 'mobx-utils'

import { AttendeeInfo, Maybe, PurchaseType } from '../../../back-end/types/misc'
import { Purchases } from '../../../back-end/types/route-types'
import { objectValues } from '../../../back-end/utils/misc'
import { request } from '../mobx/request'
import WindowObservables from '../mobx/WindowObservables'
import { vibefetch } from '../vibefetch'
import Store from './Store'

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

export class PurchaseForm {

    constructor(isInitialPurchase: boolean) {
        this.attendees = (
            isInitialPurchase
                ? [ { ...BLANK_ATTENDEE, is_primary_for_account: true } ]
                : []
        )
    }

    attendees: AttendeeInfo[]

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
        if (Store.purchasedTickets.length === 0 && !this.hasClickedWaiver) {
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

    get sleepingBagsToBuy() {
        return this.attendees.length + (Store.purchasedTickets.length - (Store.purchasedSleepingBags?.length ?? 0))
    }

    get pillowsToBuy() {
        return this.attendees.length + (Store.purchasedTickets.length - (Store.purchasedPillows?.length ?? 0))
    }

    get busTicketsToBuy() {
        return this.attendees.length + (Store.purchasedTickets.length - (Store.purchasedBusTickets?.length ?? 0))
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
            purchases.SLEEPING_BAG_VIBECLIPSE_2024 = this.sleepingBagsToBuy
        }

        if (this.needsPillow) {
            purchases.PILLOW_WITH_CASE_VIBECLIPSE_2024 = this.pillowsToBuy
        }

        if (this.needsBusTickets) {
            purchases[this.needsBusTickets] = this.busTicketsToBuy
        }

        return purchases
    }

    readonly addAttendee = () => {
        this.attendees.push({ ...BLANK_ATTENDEE, is_primary_for_account: false })
    }

    readonly removeAttendee = createTransformer((index: number) => () => {
        if (index > 0) {
            this.attendees.splice(index, 1)
        }
    })

    readonly createAttendees = request(async () => {
        if (!this.isValid) {
            return
        }

        await vibefetch(Store.jwt, '/purchase/create-attendees', 'post', this.attendees)
    }, { lazy: true })

    readonly stripeOptions = request(async () => {
        if (Store.loggedIn && this.isValid && Object.values(this.purchases).some(count => count > 0)) {
            const { body: response } = await vibefetch(
                Store.jwt,
                '/purchase/create-intent',
                'post',
                this.purchases
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

    readonly goToTicketPayment = () => {
        this.showingErrors = true

        if (this.isValid) {
            WindowObservables.assignHashState({ ticketPurchaseModalState: 'payment' })
        }
    }

    // readonly bouncePayment = autorun(() => {
    //     if (WindowObservables.hashState?.ticketPurchaseModalState === 'payment' && this.stripeOptions.state.kind === 'result' && this.stripeOptions.state.result == null) {
    //         WindowObservables.assignHashState({ ticketPurchaseModalState: 'selection' })
    //     }
    // })
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

export const needsAdultTicket = (age: number | null) => purchaseTypeFromAge(age) === 'ATTENDANCE_VIBECLIPSE_2024_OVER_16'
export const doesntNeedAdultTicket = (age: number | null) => purchaseTypeFromAge(age) !== 'ATTENDANCE_VIBECLIPSE_2024_OVER_16'

const purchaseTypeFromAge = (age: number | null): PurchaseType | undefined => {
    if (age == null || age >= 16) {
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
}
