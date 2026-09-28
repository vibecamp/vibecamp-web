import { defineRoute } from '@/lib/define-route'
import { resetPassword } from '@/server/account'

export const dynamic = 'force-dynamic'

export const { PUT } = defineRoute({
    endpoint: '/account/reset-password',
    method: 'put',
    requireAuth: false,
    handler: ({ body }) => resetPassword(body),
})
