import { createTransformer } from 'mobx-utils'

import { Tables } from '../../../back-end/types/db-types'
import { AttendeeInfo } from '../../../back-end/types/misc'
import { Purchases } from '../../../back-end/types/route-types'
import { objectValues } from '../../../back-end/utils/misc'
import { request } from '../mobx/request'
import WindowObservables from '../mobx/WindowObservables'
import { vibefetch } from '../vibefetch'
import Store from './Store'

const BLANK_ATTENDEE: Readonly<Omit<AttendeeInfo, 'is_primary_for_account'> & { ticket_type: Tables['purchase_type']['purchase_type_id'] | null }> = {
    name: '',
    discord_handle: null,
    twitter_handle: null,
    interested_in_volunteering_as: null,
    interested_in_pre_call: false,
    planning_to_camp: false,
    age: null,
    age_range: null,
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
    ticket_type: null
}

export class PurchaseForm {

    constructor(isInitialPurchase: boolean, private readonly needsWaiverClicked: boolean) {
        this.attendees = (
            isInitialPurchase
                ? [ { ...BLANK_ATTENDEE, is_primary_for_account: true } ]
                : []
        )
    }

    attendees: Array<AttendeeInfo & { ticket_type: Tables['purchase_type']['purchase_type_id'] | null }>

    otherPurchases: Purchases = {}

    hasClickedWaiver = false

    showingErrors = false

    get numberOfAttendeesError() {
        if (this.attendees.length > 7) {
            return 'Can\'t purchase this many tickets on one account'
        }
    }

    get attendeeErrors() {
        return this.attendees.map(getAttendeeErrors)
    }
    get hasClickedWaiverError() {
        if (this.needsWaiverClicked && !this.hasClickedWaiver) {
            return 'Campsite waivers must be filled out'
        }
    }

    get isValid() {
        return this.attendeeErrors.every(errors => objectValues(errors).every(err => err == null))
            && this.numberOfAttendeesError == null
            && this.hasClickedWaiverError == null
    }

    get purchases(): Purchases {
        const purchases: Purchases = { ...this.otherPurchases }

        for (const attendee of this.attendees) {
            const ticketType = attendee.ticket_type
            if (ticketType) {
                purchases[ticketType] = (purchases[ticketType] ?? 0) + 1
            }
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

    readonly stripeOptions = request(async () => {
        if (Store.loggedIn && this.isValid && Object.values(this.purchases).some(count => count != null && count > 0)) {
            const { body: response } = await vibefetch(
                Store.jwt,
                '/purchase/create-intent',
                'post',
                {
                    purchases: this.purchases,
                    discount_codes: [],
                    attendees: this.attendees.map(({ ticket_type: _, ...attendee }) => attendee)
                }
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
}

function getAttendeeErrors(attendee: AttendeeInfo & { ticket_type: Tables['purchase_type']['purchase_type_id'] | null }): Partial<Record<keyof AttendeeInfo, string> & { ticket_type: string }> {
    const errors: Partial<Record<keyof AttendeeInfo, string> & { ticket_type: string }> = {}

    if (attendee.name === '') {
        errors.name = 'Please enter a name'
    }

    if (attendee.twitter_handle?.startsWith('@')) {
        errors.twitter_handle = 'No @ needed, just the rest of the handle'
    }

    if (attendee.age_range == null) {
        errors.age_range = 'Please select an age range'
    }

    if (attendee.ticket_type == null) {
        errors.ticket_type = 'Please make a selection'
    }

    return errors
}
