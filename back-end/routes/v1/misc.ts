import { Router, Status } from 'oak'
import { withDBConnection } from '../../utils/db.ts'
import { cached, defineRoute } from './_common.ts'
import { ONE_MINUTE_MS } from '../../utils/constants.ts'
import { Tables } from '../../types/db-types.ts'

export default function register(router: Router) {

    defineRoute(router, {
        endpoint: '/festival-info',
        method: 'get',
        requireAuth: true,
        handler: async () => {
            const festival = await withDBConnection(async db =>
                (await db.queryTable('next_festival'))[0] as Tables['festival'] | undefined)

            if (festival == null) {
                throw Error('Failed to find next_festival in the database')
            }

            return [{
                ...festival,
                start_date: festival.start_date.toISOString(),
                end_date: festival.end_date.toISOString(),
            }, Status.OK]
        }
    })
}