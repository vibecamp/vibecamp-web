import { defineRoute } from '@/lib/define-route'
import { bookmarkEvent } from '@/server/events'

export const dynamic = 'force-dynamic'

export const { POST } = defineRoute({
    endpoint: '/event/bookmark',
    method: 'post',
    requireAuth: true,
    handler: async ({ jwt, body }) => [null, await bookmarkEvent(jwt.account_id, body.event_id)],
})
