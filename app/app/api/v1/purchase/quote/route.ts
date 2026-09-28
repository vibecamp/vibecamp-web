import { defineRoute } from '@/lib/define-route'
import { purchaseQuote } from '@/server/purchase'
export const dynamic = 'force-dynamic'
export const { POST } = defineRoute({
    endpoint: '/purchase/quote',
    method: 'post',
    requireAuth: true,
    handler: async ({ jwt, body }) => [(await purchaseQuote(jwt.account_id, body)).quote, 200],
})
