import { defineRoute } from '@/lib/define-route'
import { purchaseCatalog } from '@/server/purchase'
export const dynamic = 'force-dynamic'
export const { GET } = defineRoute({
    endpoint: '/purchase/catalog',
    method: 'get',
    requireAuth: false,
    handler: async () => [await purchaseCatalog(), 200],
})
