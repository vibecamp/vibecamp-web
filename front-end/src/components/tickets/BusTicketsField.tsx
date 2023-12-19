import React from 'react'

import { PURCHASE_TYPES_BY_TYPE } from '../../../../back-end/types/misc'
import { useObservableClass } from '../../mobx/hooks'
import { observer, setter } from '../../mobx/misc'
import { PurchaseForm } from '../../stores/PurchaseForm'
import Store from '../../stores/Store'
import InfoBlurb from '../core/InfoBlurb'
import RadioGroup from '../core/RadioGroup'
import Spacer from '../core/Spacer'

export default observer((props: { purchaseForm: PurchaseForm }) => {
    const state = useObservableClass(class {
        get busTicketOptions() {
            return [
                ...BUS_TICKET_PURCHASE_TYPES.map(r => ({
                    value: r.purchase_type_id,
                    label: `$${(r.price_in_cents / 100).toFixed(2)} per attendee - ${r.description}`
                })),
                { value: null, label: `No Cost - ${props.purchaseForm.attendees.length === 1 ? 'I\'ll' : 'we\'ll'} get ${props.purchaseForm.attendees.length === 1 ? 'myself' : 'ourselves'} to camp, thanks!` },
            ]
        }
    })

    return (
        <>
            <RadioGroup
                value={props.purchaseForm.needsBusTickets}
                onChange={setter(props.purchaseForm, 'needsBusTickets')}
                options={state.busTicketOptions}
                error={props.purchaseForm.showingErrors && props.purchaseForm.needsBusTicketsError}
            />

            {Store.purchasedTickets.length === 0 &&
                <>
                    <Spacer size={8} />

                    <InfoBlurb>
                        {'You\'ll have the opportunity to come back and buy these later if you\'d like to!'}
                    </InfoBlurb>
                </>}

            <Spacer size={8} />

            <InfoBlurb>
                {`Parking will be free at the event, but if you'd rather
            get to AUS airport and leave the rest to us, you can sign
            up for a bus seat for $60 round trip.`}&nbsp;
                <b>All bus tickets include a return trip to AUS from Camp
                Champions with a departure time of 3:30 pm, April 8th.</b>
            </InfoBlurb>
        </>
    )
})

export const BUS_TICKET_PURCHASE_TYPES = [
    PURCHASE_TYPES_BY_TYPE.BUS_330PM_VIBECLIPSE_2024,
    PURCHASE_TYPES_BY_TYPE.BUS_430PM_VIBECLIPSE_2024,
    PURCHASE_TYPES_BY_TYPE.BUS_730PM_VIBECLIPSE_2024,
    PURCHASE_TYPES_BY_TYPE.BUS_830PM_VIBECLIPSE_2024
] as const
