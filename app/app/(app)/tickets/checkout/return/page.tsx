'use client'

import { useRouter, useSearchParams } from 'next/navigation'
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
    const router = useRouter()
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
                                router.replace(
                                    afterPurchasePath(account?.owned_tickets ?? [], orderId),
                                ),
                            )
                    } else if (state.status === 'closed') router.replace(TICKETS_PATH)
                }}
            />
        </div>
    )
}
