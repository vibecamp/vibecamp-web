import { defineRoute } from '@/lib/define-route'
import { saveTicketBadge } from '@/server/tickets'
export const dynamic = 'force-dynamic'
export const { PUT } = defineRoute({
    endpoint: '/ticket/badge',
    method: 'put',
    requireAuth: true,
    handler: async ({ jwt, body }) => [await saveTicketBadge(jwt.account_id, body), 200],
})
