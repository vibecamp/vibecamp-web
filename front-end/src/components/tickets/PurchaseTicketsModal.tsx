import React, { useCallback, useMemo } from 'react'

import useHashState from '../../hooks/useHashState'
import usePurchaseFormState from '../../hooks/usePurchaseFormState'
import { useStore } from '../../hooks/useStore'
import { wait } from '../../utils'
import { vibefetch } from '../../vibefetch'
import { BadgesList } from '../Account'
import Button from '../core/Button'
import Col from '../core/Col'
import InfoBlurb from '../core/InfoBlurb'
import MultiView from '../core/MultiView'
import Spacer from '../core/Spacer'
import StripePaymentForm from '../core/StripePaymentForm'
import SelectionView from './SelectionView'

export default React.memo(() => {
    const store = useStore()
    const { hashState, setHashState } = useHashState()

    const campChampionsID = useMemo(() =>
        store.festivalSites.state.result?.find(f => f.festival_site_name === 'Camp Champions')!.festival_site_id
    , [store.festivalSites.state.result])

    const festivalsAtCampChampions = useMemo(() =>
        store.festivals.state.result?.filter(f => f.festival_site_id === campChampionsID)
    , [campChampionsID, store.festivals.state.result])

    const ticketPurchaseModalState = hashState?.ticketPurchaseModalState
    const isAtCampChampions = festivalsAtCampChampions != null && festivalsAtCampChampions.some(f => f.festival_id === ticketPurchaseModalState)
    const existingTickets =
        ticketPurchaseModalState == null || ticketPurchaseModalState === 'payment' || ticketPurchaseModalState === 'badges'
            ? []
            : store.purchasedTicketsByFestival[ticketPurchaseModalState!]
    const hasTicketsForThisFestival = (existingTickets ?? []).length > 0
    const purchaseFormState = usePurchaseFormState({ isInitialPurchase: !hasTicketsForThisFestival, needsWaiverClicked: isAtCampChampions && !hasTicketsForThisFestival })

    const festival = store.festivals.state.result?.find(f => f.festival_id === ticketPurchaseModalState)

    const handlePurchaseCompletion = useCallback(async () => {
        await vibefetch(
            store.jwt,
            '/account/save-attendees',
            'put',
            {
                attendees: purchaseFormState.attendees.map(({ ticket_type: _, ...attendee }) => attendee),
            }
        )

        // HACK: When the purchase flow completes, the webhook will take an
        // indeterminate amount of time to record the purchases. So, we wait a couple
        // seconds before refreshing the list, which should usually be enough
        await wait(2000)

        setHashState({ ticketPurchaseModalState: 'badges' })

        await store.accountInfo.load()
    }, [purchaseFormState.attendees, setHashState, store.accountInfo, store.jwt])

    const attendeeBadges = useMemo(() => {
        const accountInfo = store.accountInfo.state.result
        if (accountInfo == null || festival == null) {
            return []
        }

        return accountInfo.attendees
            .map(({ attendee_id, name }) => ({
                attendee_id,
                name,
                badge_exists: accountInfo.badges.some(badge => badge.festival_id === festival.festival_id && badge.attendee_id === attendee_id)
            }))
    }, [festival, store.accountInfo.state.result])

    return (
        <MultiView
            views={[
                {
                    name: 'selection',
                    content: (
                        <SelectionView
                            purchaseFormState={purchaseFormState}
                            goToNext={purchaseFormState.goToTicketPayment}
                            festival={festival}
                        />
                    )
                },
                {
                    name: 'payment',
                    content: (
                        <StripePaymentForm
                            stripeOptions={purchaseFormState.stripeOptions.state.result}
                            purchases={purchaseFormState.purchases}
                            discountCode={purchaseFormState.discountCode}
                            onCompletePurchase={handlePurchaseCompletion}
                        />
                    )
                },
                {
                    name: 'badges',
                    content: (
                        <Col padding={20} pageLevel>
                            <h2 style={{ fontSize: 24 }}>
                                Add badge info?
                            </h2>

                            <Spacer size={8} />

                            <InfoBlurb>
                                You can edit this later from the Account tab
                            </InfoBlurb>

                            <Spacer size={32} />

                            {festival &&
                                <BadgesList festival={festival} attendeeBadges={attendeeBadges} />}

                            <Spacer size={32} />

                            <Button onClick={() => setHashState({ currentView: 'Tickets', ticketPurchaseModalState: undefined })}>
                                Close
                            </Button>
                        </Col>
                    )
                }
            ]}
            currentView={hashState?.ticketPurchaseModalState === 'payment' ? 'payment' : hashState?.ticketPurchaseModalState === 'badges' ? 'badges' : 'selection'}
        />
    )
})
