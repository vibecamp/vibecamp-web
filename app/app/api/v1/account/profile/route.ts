import { defineRoute } from '@/lib/define-route'
import { saveProfile } from '@/server/tickets'
export const dynamic = 'force-dynamic'
export const { PUT } = defineRoute({
    endpoint: '/account/profile',
    method: 'put',
    requireAuth: true,
    handler: async ({ jwt, body }) => [await saveProfile(jwt.account_id, body), 200],
})
