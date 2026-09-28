import { db } from '@/db'
import { age_range, event_site, festival } from '@/db/schema'
import { defineRoute } from '@/lib/define-route'

export const dynamic = 'force-dynamic'

export const { GET } = defineRoute({
    endpoint: '/reference',
    method: 'get',
    requireAuth: false,
    handler: async () => {
        const [festivals, event_sites, age_ranges] = await Promise.all([
            db.select().from(festival),
            db.select().from(event_site),
            db.select().from(age_range),
        ])
        return [{ festivals, event_sites, age_ranges }, 200]
    },
})
