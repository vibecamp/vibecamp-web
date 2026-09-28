import { defineRoute } from '@/lib/define-route'
import { getAllEvents } from '@/server/events'

export const dynamic = 'force-dynamic'

export const { GET } = defineRoute({
    endpoint: '/events',
    method: 'get',
    requireAuth: false,
    handler: async () => [{ events: await getAllEvents() }, 200],
})
