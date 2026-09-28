import { defineRoute } from '@/lib/define-route'
import { deleteEvent } from '@/server/events'

export const dynamic = 'force-dynamic'

export const { POST } = defineRoute({
    endpoint: '/event/delete',
    method: 'post',
    requireAuth: true,
    handler: async ({ jwt, body }) => [null, await deleteEvent(jwt.account_id, body.event_id)],
})
