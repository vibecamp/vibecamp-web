import { defineRoute } from '@/lib/define-route'
import { getJwtPayload } from '@/server/auth'
import { getAllEvents } from '@/server/events'

export const dynamic = 'force-dynamic'

export const { GET } = defineRoute({
    endpoint: '/events',
    method: 'get',
    requireAuth: false,
    handler: async ({ req }) => [
        { events: await getAllEvents((await getJwtPayload(req))?.account_id) },
        200,
    ],
})
