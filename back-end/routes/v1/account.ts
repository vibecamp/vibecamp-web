import { Router, Status } from 'oak'
import { defineRoute } from './_common.ts'
import { fullAccountInfo, useInviteCode } from '../../db.ts'
import { FullAccountInfo } from '../../common/data.ts'

export default function register(router: Router) {
  const baseRoute = '/account'

  // purchase one or multiple tickets, fill out baseline required attendee info
  defineRoute<FullAccountInfo | null>(router, {
    endpoint: baseRoute,
    method: 'get',
    requireAuth: true,
    handler: async ({ jwt }) => {
      const { account_id } = jwt

      const account = await fullAccountInfo(account_id)

      if (account != null) {
        return [account, Status.OK]
      } else {
        return [null, Status.NotFound]
      }
    },
  })

  defineRoute<null>(router, {
    endpoint: baseRoute + '/submit-invite-code',
    method: 'post',
    requireAuth: true,
    handler: async ({ jwt, body: { invite_code } }) => {
      const { account_id } = jwt

      if (typeof invite_code !== 'string') {
        return [null, Status.BadRequest]
      }

      const success = await useInviteCode(account_id, invite_code)

      if (success) {
        return [null, Status.OK]
      } else {
        return [null, Status.InternalServerError]
      }
    },
  })
}
