import { defineRoute } from '@/lib/define-route'
import { getJwtPayload } from '@/server/auth'
import { purchaseQuote } from '@/server/purchase'
export const dynamic = 'force-dynamic'
export const { POST } = defineRoute({
    endpoint: '/purchase/quote',
    method: 'post',
    requireAuth: false,
    handler: async ({ req, body }) => [
        (await purchaseQuote((await getJwtPayload(req))?.account_id ?? null, body)).quote,
        200,
    ],
})
