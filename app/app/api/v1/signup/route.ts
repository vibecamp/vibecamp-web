import { defineRoute, rateLimited } from '@/lib/define-route'
import { signup } from '@/server/account'

export const dynamic = 'force-dynamic'

export const { POST } = defineRoute({
    endpoint: '/signup',
    method: 'post',
    requireAuth: false,
    handler: rateLimited(500, ({ body }) => signup(body)),
})
