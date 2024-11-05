import React, { useMemo } from 'react'

import { Purchases } from '../../../../back-end/types/route-types'
import { formatCents, purchaseBreakdown, totalCost } from '../../../../back-end/utils/misc'
import { usePromise } from '../../hooks/usePromise'
import { useStore } from '../../hooks/useStore'
import { vibefetch } from '../../vibefetch'
import Spacer from '../core/Spacer'

type Props = {
    purchases: Purchases,
    discountCode: string
}

export default React.memo(({ purchases, discountCode }: Props) => {
    const store = useStore()

    const allPurchaseTypes = store.purchaseTypes.state.result

    const appliedDiscounts = usePromise(() =>
        vibefetch(store.jwt, '/discounts-by-code', 'post', { discount_code: discountCode })
            .then(res => res.body)
    , [discountCode, store.jwt]).state.result

    const breakdown = useMemo(() =>
        allPurchaseTypes && purchaseBreakdown(purchases, appliedDiscounts ?? [], allPurchaseTypes)
    , [allPurchaseTypes, appliedDiscounts, purchases])

    if (!allPurchaseTypes || !breakdown) {
        return null
    }

    const total = totalCost(breakdown)

    return (
        <>
            {breakdown.map(({ purchaseType, count, basePrice, discountMultiplier, discountedPrice }) => {
                return (
                    <React.Fragment key={purchaseType.purchase_type_id}>
                        <div className='price-line-item'>
                            <div>
                                {purchaseType.description} x {count}
                            </div>
                            <div>
                                <span style={discountMultiplier != null ? { textDecoration: 'line-through' } : undefined}>
                                    ${formatCents(basePrice)}
                                </span>

                                {discountMultiplier != null &&
                                    <span>
                                        &nbsp;
                                        ${formatCents(discountedPrice)}
                                    </span>}
                            </div>
                        </div>

                        <Spacer size={8} />
                    </React.Fragment>
                )
            })}

            {breakdown.length > 0 &&
                <>
                    <hr />
                    <Spacer size={8} />
                </>}

            {appliedDiscounts && appliedDiscounts.length > 0 &&
                <>
                    <div className='price-line-item'>
                        <div>
                            Discount code:
                        </div>
                        <div>
                            {discountCode}
                        </div>
                    </div>

                    <Spacer size={8} />
                </>}

            <div className='price-line-item'>
                <div>
                    Total:
                </div>
                <div>
                    ${formatCents(total)}
                </div>
            </div>
        </>
    )
})