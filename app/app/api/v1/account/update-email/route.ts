import { defineRoute } from '@/lib/define-route'
import { updateEmail } from '@/server/account'

export const dynamic = 'force-dynamic'

export const { PUT } = defineRoute({
    endpoint: '/account/update-email',
    method: 'put',
    requireAuth: true,
    handler: async ({ jwt, body }) => [null, await updateEmail(jwt.account_id, body.email_address)],
})
