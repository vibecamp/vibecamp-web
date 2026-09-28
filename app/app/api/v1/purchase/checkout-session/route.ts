import { defineRoute } from '@/lib/define-route'
import { createCheckoutSession } from '@/server/purchase'

export const dynamic = 'force-dynamic'

export const { POST } = defineRoute({
    endpoint: '/purchase/checkout-session',
    method: 'post',
    requireAuth: true,
    handler: async ({ jwt, body }) => [await createCheckoutSession(jwt.account_id, body), 200],
})
