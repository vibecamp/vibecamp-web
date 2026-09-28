import { defineRoute, rateLimited } from '@/lib/define-route'
import { login } from '@/server/account'

export const dynamic = 'force-dynamic'

export const { POST } = defineRoute({
    endpoint: '/login',
    method: 'post',
    requireAuth: false,
    handler: rateLimited(500, ({ body }) => login(body)),
})
