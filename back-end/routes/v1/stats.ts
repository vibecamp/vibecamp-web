import { Router, Status } from 'oak'
import { defineRoute } from './_common.ts'
import {withDBConnection, festivalStats, accountReferralStatus} from '../../utils/db.ts'

export default function register(router: Router) {
  defineRoute(router, {
    endpoint: '/stats',
    method: 'get',
    requireAuth: true,
    handler: async ({ jwt: { account_id }}) => {
      // only these accounts are allowed to see stats
      // if ([
      //     'allowed-account-id-1',
      // ].indexOf(account_id) === -1) {
      //   return [null, Status.Forbidden]
      // }

      const stats = await withDBConnection(db => {
        return festivalStats(db)
      })

      return [stats, Status.OK]
    }
  })
}
