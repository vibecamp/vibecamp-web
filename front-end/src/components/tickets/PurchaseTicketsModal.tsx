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
    const purchaseForm = useStable(() => {
        return makeAutoObservable(new PurchaseForm(Store.purchasedTickets.length === 0))
    })

    return (
        <MultiView
            views={[
                {
                    name: 'selection', content:
                        <SelectionView
                            purchaseForm={purchaseForm}
                            goToNext={purchaseForm.goToTicketPayment}
                        />
                },
                {
                    name: 'payment', content:
                        <StripePaymentForm
                            stripeOptions={purchaseForm.stripeOptions.state.result}
                            purchases={purchaseForm.purchases}
                            onPrePurchase={purchaseForm.createAttendees.load}
                            onCompletePurchase={handlePurchaseCompletion}
                        />
                }
            ]}
            currentView={WindowObservables.hashState?.ticketPurchaseModalState}
        />
    )
})

const handlePurchaseCompletion = async () => {
    // HACK: When the purchase flow completes, the webhook will take an
    // indeterminate amount of time to record the purchases. So, we wait a couple
    // seconds before refreshing the list, which should usually be enough
    await wait(2000)

    WindowObservables.assignHashState({ currentView: 'Tickets', ticketPurchaseModalState: 'none' })

    await Store.accountInfo.load()
}