import { makeAutoObservable } from 'mobx'
import React from 'react'

import { useStable } from '../../mobx/hooks'
import { observer } from '../../mobx/misc'
import WindowObservables from '../../mobx/WindowObservables'
import { PurchaseForm } from '../../stores/PurchaseForm'
import Store from '../../stores/Store'
import { wait } from '../../utils'
import MultiView from '../core/MultiView'
import StripePaymentForm from '../core/StripePaymentForm'
import SelectionView from './SelectionView'

export default observer(() => {
    const campChampionsID = Store.festivalSites.state.result?.find(f => f.festival_site_name === 'Camp Champions')!.festival_site_id
    const festivalsAtCampChampions = Store.festivals.state.result?.filter(f => f.festival_site_id === campChampionsID)

    const purchaseForm = useStable(() => {
        const isAtCampChampions = festivalsAtCampChampions != null && festivalsAtCampChampions.some(f => f.festival_id === WindowObservables.hashState?.ticketPurchaseModalState)
        const existingTickets = Store.purchasedTicketsByFestival[WindowObservables.hashState?.ticketPurchaseModalState as string]
        const hasTicketsForThisFestival = (existingTickets ?? []).length > 0
        return makeAutoObservable(new PurchaseForm(!hasTicketsForThisFestival, isAtCampChampions && !hasTicketsForThisFestival))
    })

    return (
        <MultiView
            views={[
                {
                    name: 'selection', content:
                        <SelectionView
                            purchaseForm={purchaseForm}
                            goToNext={purchaseForm.goToTicketPayment}
                            festival={Store.festivals.state.result?.find(f => f.festival_id === WindowObservables.hashState?.ticketPurchaseModalState)}
                        />
                },
                {
                    name: 'payment', content:
                        <StripePaymentForm
                            stripeOptions={purchaseForm.stripeOptions.state.result}
                            purchases={purchaseForm.purchases}
                            onCompletePurchase={handlePurchaseCompletion}
                        />
                }
            ]}
            currentView={WindowObservables.hashState?.ticketPurchaseModalState === 'payment' ? 'payment' : 'selection'}
        />
    )
})

const handlePurchaseCompletion = async () => {
    // HACK: When the purchase flow completes, the webhook will take an
    // indeterminate amount of time to record the purchases. So, we wait a couple
    // seconds before refreshing the list, which should usually be enough
    await wait(2000)

    WindowObservables.assignHashState({ currentView: 'Tickets', ticketPurchaseModalState: null })

    await Store.accountInfo.load()
}