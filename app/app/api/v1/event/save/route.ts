import { defineRoute } from '@/lib/define-route'
import { saveEvent } from '@/server/events'

export const dynamic = 'force-dynamic'

export const { POST } = defineRoute({
    endpoint: '/event/save',
    method: 'post',
    requireAuth: true,
    handler: async ({ jwt, body }) => [null, await saveEvent(jwt.account_id, body.event)],
})
