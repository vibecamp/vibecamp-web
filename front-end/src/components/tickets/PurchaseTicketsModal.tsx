import React, { useCallback, useMemo } from 'react'

import { Tables } from '../../../../back-end/types/db-types'
import useHashState from '../../hooks/useHashState'
import usePurchaseFormState from '../../hooks/usePurchaseFormState'
import { useStore } from '../../hooks/useStore'
import { wait } from '../../utils'
import MultiView from '../core/MultiView'
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
        ticketPurchaseModalState == null || ticketPurchaseModalState === 'payment'
            ? []
            : store.purchasedTicketsByFestival[ticketPurchaseModalState!]
    const hasTicketsForThisFestival = (existingTickets ?? []).length > 0
    const purchaseFormState = usePurchaseFormState({ isInitialPurchase: !hasTicketsForThisFestival, needsWaiverClicked: isAtCampChampions && !hasTicketsForThisFestival })

    const festival = store.festivals.state.result?.find(f => f.festival_id === ticketPurchaseModalState)

    const handlePurchaseCompletion = useCallback(async () => {
        // HACK: When the purchase flow completes, the webhook will take an
        // indeterminate amount of time to record the purchases. So, we wait a couple
        // seconds before refreshing the list, which should usually be enough
        await wait(2000)

        setHashState({ currentView: 'Tickets', ticketPurchaseModalState: undefined })

        await store.accountInfo.load()
    }, [setHashState, store.accountInfo])

    return (
        <MultiView
            views={[
                {
                    name: 'selection',
                    content: (
                        <SelectionView
                            purchaseFormState={purchaseFormState}
                            goToNext={purchaseFormState.goToTicketPayment}
                            festival={store.festivals.state.result?.find(f => f.festival_id === hashState?.ticketPurchaseModalState)}
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
                }
            ]}
            currentView={hashState?.ticketPurchaseModalState === 'payment' ? 'payment' : 'selection'}
        />
    )
})
