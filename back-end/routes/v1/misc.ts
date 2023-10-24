import { Router, Status } from 'oak'
import { withDBConnection } from '../../db.ts'
import { defineRoute } from './_common.ts'

export default function register(router: Router) {

    defineRoute(router, {
        endpoint: '/festival-info',
        method: 'get',
        requireAuth: true,
        handler: async () => {
            const festival = await withDBConnection(async db => (await db.queryTable('next_festival'))[0])

            if (festival == null) {
                return [null, Status.NotFound]
            }

            const { festival_name, start_date, end_date } = festival

            if (festival_name == null || start_date == null || end_date == null) {
                return [null, Status.InternalServerError]
            }

            return [{
                festival_name,
                start_date: start_date.toISOString(),
                end_date: end_date.toISOString(),
            }, Status.OK]
        }
    })
}