import React from 'react'

import { Purchases } from '../../../../back-end/types/route-types'
import { objectEntries, sum } from '../../../../back-end/utils/misc'
import { useObservableClass } from '../../mobx/hooks'
import { observer } from '../../mobx/misc'
import Store from '../../stores/Store'
import Spacer from '../core/Spacer'

type Props = {
    purchases: Purchases
}

export default observer((props: Props) => {
    const state = useObservableClass(class {
        get entries() {
            return objectEntries(props.purchases)
        }
    })

    const purchaseTypes = Store.purchaseTypes.state.result

    if (!purchaseTypes) {
        return null
    }

    return (
        <>
            {state.entries.map(([purchase_id, count]) => {
                const purchaseType = purchaseTypes.find(p => p.purchase_type_id === purchase_id)!

                return (
                    <React.Fragment key={purchase_id}>
                        <div className='price-line-item'>
                            <div>
                                {purchaseType.description} x {count}
                            </div>
                            <div>
                                {/* eslint-disable-next-line @typescript-eslint/no-non-null-assertion */}
                            ${(purchaseType.price_in_cents * count! / 100).toFixed(2)}
                            </div>
                        </div>

                        <Spacer size={8} />
                    </React.Fragment>
                )
            })}

            {state.entries.length > 0 &&
                <>
                    <hr />
                    <Spacer size={8} />
                </>}

            <div className='price-line-item'>
                <div>
                    Total:
                </div>
                <div>
                    ${state.entries
                        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                        .map(([purchase_id, count]) => purchaseTypes.find(p => p.purchase_type_id === purchase_id)!.price_in_cents * count! / 100)
                        .reduce(sum, 0)
                        .toFixed(2)}
                </div>
            </div>
        </>
    )
})