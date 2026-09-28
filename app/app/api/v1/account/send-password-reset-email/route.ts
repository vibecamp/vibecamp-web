import { defineRoute, rateLimited } from '@/lib/define-route'
import { sendPasswordResetEmail } from '@/server/account'

export const dynamic = 'force-dynamic'

export const { POST } = defineRoute({
    endpoint: '/account/send-password-reset-email',
    method: 'post',
    requireAuth: false,
    handler: rateLimited(500, async ({ body }) => [
        null,
        await sendPasswordResetEmail(body.email_address),
    ]),
})
