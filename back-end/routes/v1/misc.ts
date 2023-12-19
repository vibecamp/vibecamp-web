import { Router, Status } from 'oak'
import { withDBConnection } from '../../utils/db.ts'
import { defineRoute } from './_common.ts'
import { TABLE_ROWS, Tables } from '../../types/db-types.ts'

export default function register(router: Router) {

    defineRoute(router, {
        endpoint: '/festival-info',
        method: 'get',
        requireAuth: true,
        handler: async () => {
            return [TABLE_ROWS.next_festival[0], Status.OK]
        }
    })
}