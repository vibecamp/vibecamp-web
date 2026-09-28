import { defineRoute } from '@/lib/define-route'
import { getBookmarks } from '@/server/events'

export const dynamic = 'force-dynamic'

export const { GET } = defineRoute({
    endpoint: '/event/bookmarks',
    method: 'get',
    requireAuth: true,
    handler: async ({ jwt }) => [{ event_ids: await getBookmarks(jwt.account_id) }, 200],
})
