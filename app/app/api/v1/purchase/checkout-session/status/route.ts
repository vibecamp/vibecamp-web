import { defineRoute } from '@/lib/define-route'
import { checkoutStatus } from '@/server/purchase'

export const dynamic = 'force-dynamic'

export const { POST } = defineRoute({
    endpoint: '/purchase/checkout-session/status',
    method: 'post',
    requireAuth: true,
    handler: async ({ jwt, body }) => [await checkoutStatus(jwt.account_id, body), 200],
})
