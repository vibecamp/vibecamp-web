'use client'

import { useSearchParams } from 'next/navigation'
import { useNav } from '@/components/NavStack'
import CheckoutState from '@/components/tickets/CheckoutState'
import { useStore } from '@/hooks/useStore'
import { TICKETS_PATH } from '@/lib/routes'
import type { OwnedTicket } from '@/server/tickets'

function afterPurchasePath(owned: readonly OwnedTicket[], orderId: string) {
    const bought = owned.filter((p) => p.checkout_order_id === orderId)
    const id =
        bought.find((p) => p.is_attendance_ticket)?.purchase_id ??
        bought.find((p) => p.parent_purchase_id)?.parent_purchase_id
    return id ? `${TICKETS_PATH}/owned/${id}` : TICKETS_PATH
}

export default function CheckoutReturn() {
    const nav = useNav()
    const store = useStore()
    const orderId = useSearchParams().get('order_id')
    if (!orderId) return null
    return (
        <div className='page narrow'>
            <CheckoutState
                orderId={orderId}
                onResolved={(state) => {
                    if (state.status === 'fulfilled') {
                        void store
                            .refreshAfterPurchase()
                            .then((account) =>
                                nav.reset(afterPurchasePath(account?.owned_tickets ?? [], orderId)),
                            )
                    } else if (state.status === 'closed') nav.replace(TICKETS_PATH)
                }}
            />
        </div>
    )
}
