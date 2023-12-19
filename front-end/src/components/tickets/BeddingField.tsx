import React from 'react'

import { PURCHASE_TYPES_BY_TYPE } from '../../../../back-end/types/misc'
import { useObservableClass } from '../../mobx/hooks'
import { observer, setter } from '../../mobx/misc'
import { PurchaseForm } from '../../stores/PurchaseForm'
import Store from '../../stores/Store'
import Checkbox from '../core/Checkbox'
import InfoBlurb from '../core/InfoBlurb'
import RadioGroup from '../core/RadioGroup'
import Spacer from '../core/Spacer'

export default observer((props: { purchaseForm: PurchaseForm }) => {
    const state = useObservableClass(class {
        get options() {
            return [
                {
                    value: true,
                    label: `Yes, I would like to purchase ${props.purchaseForm.sleepingBagsToBuy === 1 ? 'a sleeping bag' : `${props.purchaseForm.sleepingBagsToBuy} sleeping bags`} ($${PURCHASE_TYPES_BY_TYPE.SLEEPING_BAG_VIBECLIPSE_2024.price_in_cents / 100} each)`
                },
                {
                    value: false,
                    label: `No, ${props.purchaseForm.attendees.length === 1 ? 'I' : 'we'} will be bringing ${props.purchaseForm.attendees.length === 1 ? 'my' : 'our'} own bedding`
                },
            ]
        }
    })

    return (
        <>
            <RadioGroup
                value={props.purchaseForm.needsSleepingBags}
                onChange={setter(props.purchaseForm, 'needsSleepingBags')}
                options={state.options}
                error={props.purchaseForm.showingErrors && props.purchaseForm.needsSleepingBagsError}
            />

            <Spacer size={16} />

            <Checkbox value={props.purchaseForm.needsPillow} onChange={setter(props.purchaseForm, 'needsPillow')}>
                I would like {props.purchaseForm.pillowsToBuy === 1 ? 'a pillow' : `${props.purchaseForm.pillowsToBuy} pillows`} (${PURCHASE_TYPES_BY_TYPE.PILLOW_WITH_CASE_VIBECLIPSE_2024.price_in_cents / 100} each)
            </Checkbox>

            {Store.purchasedTickets.length === 0 &&
                <>
                    <Spacer size={16} />

                    <InfoBlurb>
                        {'You\'ll have the opportunity to come back and buy these later if you\'d like to!'}
                    </InfoBlurb>
                </>}

            <Spacer size={16} />

            <InfoBlurb>
                {`Camp Champions will have small (slightly smaller than 
                    twin), bare mattresses within the cabins. We recommend 
                    you pack along whatever bedding you'd be most 
                    comfortable with, but if for whatever reason you are 
                    unable to provide your own, we'll be offering 3-season 
                    sleeping bags for purchase. If you buy one and would prefer 
                    to donate it instead, we'll be making a donation run at the 
                    end of the event.`}
            </InfoBlurb>

        </>
    )
})