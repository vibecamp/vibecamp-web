import React, { useMemo } from 'react'

import { Purchases } from '../../../../back-end/types/route-types'
import { objectEntries, sum } from '../../../../back-end/utils/misc'
import { useStore } from '../../hooks/useStore'
import Spacer from '../core/Spacer'

type Props = {
    purchases: Purchases
}

export default React.memo(({ purchases }: Props) => {
    const store = useStore()
    const entries = useMemo(() => objectEntries(purchases), [purchases])

    const purchaseTypes = store.purchaseTypes.state.result

    if (!purchaseTypes) {
        return null
    }

    return (
        <>
            {entries.map(([purchase_id, count]) => {
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

            {entries.length > 0 &&
                <>
                    <hr />
                    <Spacer size={8} />
                </>}

            <div className='price-line-item'>
                <div>
                    Total:
                </div>
                <div>
                    ${entries
                        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                        .map(([purchase_id, count]) => purchaseTypes.find(p => p.purchase_type_id === purchase_id)!.price_in_cents * count! / 100)
                        .reduce(sum, 0)
                        .toFixed(2)}
                </div>
            </div>
        </>
    )
})