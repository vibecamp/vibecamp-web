import React from 'react'
import { observer } from 'mobx-react-lite'
import { PURCHASE_TYPES_BY_TYPE } from '../../../../back-end/types/misc'
import { objectEntries, sum } from '../../../../back-end/utils/misc'
import Spacer from '../core/Spacer'
import { Purchases } from '../../../../back-end/types/route-types'

type Props = {
    purchases: Purchases
}

export default observer(({ purchases }: Props) => {
    const entries = objectEntries(purchases)

    return (
        <>
            {entries.map(([purchase_id, count]) =>
                <React.Fragment key={purchase_id}>
                    <div className='price-line-item'>
                        <div>
                            {PURCHASE_TYPES_BY_TYPE[purchase_id].description} x {count}
                        </div>
                        <div>
                            {/* eslint-disable-next-line @typescript-eslint/no-non-null-assertion */}
                            ${(PURCHASE_TYPES_BY_TYPE[purchase_id].price_in_cents * count! / 100).toFixed(2)}
                        </div>
                    </div>

                    <Spacer size={8} />
                </React.Fragment>)}

            <hr />

            <Spacer size={8} />

            <div className='price-line-item'>
                <div>
                    Total:
                </div>
                <div>
                    ${entries
                        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                        .map(([purchase_id, count]) => PURCHASE_TYPES_BY_TYPE[purchase_id].price_in_cents * count! / 100)
                        .reduce(sum, 0)
                        .toFixed(2)}
                </div>
            </div>
        </>
    )
})