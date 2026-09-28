'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import CheckoutState from '@/components/tickets/CheckoutState'
import { useStore } from '@/hooks/useStore'
import { TICKETS_PATH } from '@/lib/routes'

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
                        void Promise.all([store.accountInfo.load(), store.catalog.load()]).then(
                            () => router.replace(TICKETS_PATH),
                        )
                    } else if (state.status === 'closed') router.replace(TICKETS_PATH)
                }}
            />
        </div>
    )
}
