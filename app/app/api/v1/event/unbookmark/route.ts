import { defineRoute } from '@/lib/define-route'
import { unbookmarkEvent } from '@/server/events'

export const dynamic = 'force-dynamic'

export const { POST } = defineRoute({
    endpoint: '/event/unbookmark',
    method: 'post',
    requireAuth: true,
    handler: async ({ jwt, body }) => [null, await unbookmarkEvent(jwt.account_id, body.event_id)],
})
