import { defineRoute } from '@/lib/define-route'
import { updatePassword } from '@/server/account'

export const dynamic = 'force-dynamic'

export const { PUT } = defineRoute({
    endpoint: '/account/update-password',
    method: 'put',
    requireAuth: true,
    handler: async ({ jwt, body }) => [null, await updatePassword(jwt.account_id, body.password)],
})
