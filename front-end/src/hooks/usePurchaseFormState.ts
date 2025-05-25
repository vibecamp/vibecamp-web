import { useCallback, useMemo, useState } from 'react'

import { Tables } from '../../../back-end/types/db-types'
import { AttendeeInfo } from '../../../back-end/types/misc'
import { Purchases } from '../../../back-end/types/route-types'
import { objectValues } from '../../../back-end/utils/misc'
import { Props as AttendeeInfoFormProps } from '../components/tickets/AttendeeInfoForm'
import { vibefetch } from '../vibefetch'
import useHashState from './useHashState'
import { usePromise } from './usePromise'
import { useStore } from './useStore'

export type AttendeeFormInfo = Readonly<AttendeeInfo & { ticket_type: Tables['purchase_type']['purchase_type_id'] | null }>

export default function usePurchaseFormState({ isInitialPurchase, needsWaiverClicked }: { isInitialPurchase: boolean, needsWaiverClicked: boolean }) {
    const store = useStore()
    const { setHashState } = useHashState()

    const [attendees, setAttendees] = useState<readonly AttendeeFormInfo[]>(
        isInitialPurchase
            ? [
                {
                    ...(store.accountInfo.state.result?.attendees.find(a => a.is_primary_for_account) ?? BLANK_ATTENDEE),
                    ticket_type: null,
                    is_primary_for_account: true
                }
            ]
            : []
    )

    const [otherPurchases, setOtherPurchases] = useState<Readonly<Purchases>>({})
    const [hasClickedWaiver, setHasClickedWaiver] = useState(false)
    const handleWaiverClick = useCallback(() => setHasClickedWaiver(true), [])
    const [showingErrors, setShowingErrors] = useState(false)

    const numberOfAttendeesError = (
        attendees.length > 7
            ? 'Can\'t purchase this many tickets on one account'
            : undefined
    )

    const attendeeErrorsRaw = useMemo(() => attendees.map(getAttendeeErrors), [attendees])

    const attendeeErrors: typeof attendeeErrorsRaw = useMemo(() =>
        showingErrors
            ? attendeeErrorsRaw
            : attendees.map(() => ({}))
    , [attendeeErrorsRaw, attendees, showingErrors])

    const hasClickedWaiverError = (
        needsWaiverClicked && !hasClickedWaiver
            ? 'Campsite waivers must be filled out'
            : undefined
    )

    const isValid = (
        attendeeErrorsRaw.every(errors => objectValues(errors).every(err => err == null)) &&
        numberOfAttendeesError == null &&
        hasClickedWaiverError == null
    )

    const purchases = useMemo(() => {
        const purchases: Purchases = { ...otherPurchases }

        for (const attendee of attendees) {
            const ticketType = attendee.ticket_type
            if (ticketType) {
                purchases[ticketType] = (purchases[ticketType] ?? 0) + 1
            }
        }

        return purchases
    }, [attendees, otherPurchases])

    const addAttendee = useCallback(() =>
        setAttendees([
            ...attendees,
            { ...BLANK_ATTENDEE, ticket_type: null, is_primary_for_account: false }
        ])
    , [attendees])

    const removeAttendee = (index: number) => () => {
        if (index > 0) {
            setAttendees([...attendees.slice(0, index), ...attendees.slice(index + 1)])
        }
    }

    const [discountCode, setDiscountCode] = useState('')

    const stripeOptions = usePromise(async () => {
        if (store.loggedIn && isValid && Object.values(purchases).some(count => count != null && count > 0)) {
            const { body: response } = await vibefetch(
                store.jwt,
                '/purchase/create-intent',
                'post',
                {
                    purchases,
                    discount_code: discountCode || null,
                    attendees: attendees.map(({ ticket_type: _, ...attendee }) => attendee),
                    referral_info: new URLSearchParams(window.location.search).get('referral_info') ?? undefined
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
    }, [attendees, discountCode, isValid, purchases, store.jwt, store.loggedIn])

    const goToTicketPayment = useCallback(() => {
        setShowingErrors(true)

        if (isValid) {
            setHashState({ ticketPurchaseModalState: 'payment' })
        }
    }, [isValid, setHashState])

    const setOtherPurchasesCount = useCallback((purchaseType: keyof Purchases, count: number) => {
        setOtherPurchases({ ...otherPurchases, [purchaseType]: count })
    }, [otherPurchases])

    const setAttendeeProperty = useCallback<AttendeeInfoFormProps['setAttendeeProperty']>((attendee, property, value) => {
        const index = attendees.indexOf(attendee as unknown as AttendeeFormInfo)

        if (index > -1 && index < attendees.length) {
            const newAttendee = { ...attendee, [property]: value } as unknown as AttendeeFormInfo
            setAttendees([...attendees.slice(0, index), newAttendee, ...attendees.slice(index + 1)])
        }
    }, [attendees])

    return {
        stripeOptions,
        purchases,
        otherPurchases,
        goToTicketPayment,
        showingErrors,
        attendees,
        attendeeErrorsRaw,
        attendeeErrors,
        numberOfAttendeesError,
        hasClickedWaiverError,
        handleWaiverClick,
        addAttendee,
        removeAttendee,
        setAttendeeProperty,
        setOtherPurchasesCount,
        discountCode,
        setDiscountCode
    }
}

export type PurchaseFormState = ReturnType<typeof usePurchaseFormState>

export function getAttendeeErrors(attendee: AttendeeInfo & { ticket_type: Tables['purchase_type']['purchase_type_id'] | null }): Partial<Record<keyof AttendeeInfo, string> & { ticket_type: string }> {
    const errors: Partial<Record<keyof AttendeeInfo, string> & { ticket_type: string }> = {}

    if (attendee.name === '') {
        errors.name = 'Please enter a name'
    }

    if (attendee.twitter_handle?.startsWith('@')) {
        errors.twitter_handle = 'No @ needed, just the rest of the handle'
    }

    if (attendee.phone_number && !/^ ?\(? ?[0-9]{3} ?\)? ?[0-9]{3} ?-? ?[0-9]{4} ?$/.test(attendee.phone_number)) {
        errors.phone_number = 'Please enter a valid phone number'
    }

    if (attendee.age_range == null) {
        errors.age_range = 'Please select an age range'
    }

    if (attendee.ticket_type == null) {
        errors.ticket_type = 'Please make a selection'
    }

    return errors
}

const BLANK_ATTENDEE: Readonly<Omit<AttendeeInfo, 'is_primary_for_account'>> = {
    name: '',
    discord_handle: null,
    twitter_handle: null,
    phone_number: null,
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
    share_ticket_status_with_selflathing: null
}
