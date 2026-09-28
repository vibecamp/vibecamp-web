import { defineRoute } from '@/lib/define-route'
import { getFullAccountInfo } from '@/server/account'

export const dynamic = 'force-dynamic'

export const { GET } = defineRoute({
    endpoint: '/account',
    method: 'get',
    requireAuth: true,
    handler: ({ jwt }) => getFullAccountInfo(jwt.account_id),
})
