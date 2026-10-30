import { desc, eq } from 'drizzle-orm'
import { db } from '@/db'
import * as s from '@/db/schema'
import { defineRoute } from '@/lib/define-route'

export const dynamic = 'force-dynamic'

const imageFields = { image_id: s.image.image_id, width: s.image.width, height: s.image.height }

export const { GET } = defineRoute({
    endpoint: '/reference',
    method: 'get',
    requireAuth: false,
    handler: async () => {
        const [festivals, age_ranges, locations, location_categories, images, maps] =
            await Promise.all([
                db.select().from(s.festival),
                db.select().from(s.age_range),
                db.select().from(s.location),
                db.select().from(s.location_category).orderBy(s.location_category.sort_order),
                db
                    .select({ location_id: s.location_image.location_id, ...imageFields })
                    .from(s.location_image)
                    .innerJoin(s.image, eq(s.image.image_id, s.location_image.image_id))
                    .orderBy(s.location_image.sort_order),
                db
                    .select(imageFields)
                    .from(s.map)
                    .innerJoin(s.image, eq(s.image.image_id, s.map.image_id))
                    .orderBy(desc(s.map.created_at))
                    .limit(1),
            ])
        return [
            {
                festivals,
                age_ranges,
                location_categories,
                map: maps[0] ?? null,
                locations: locations.map((l) => ({
                    ...l,
                    images: images
                        .filter((i) => i.location_id === l.location_id)
                        .map(({ location_id: _, ...i }) => i),
                })),
            },
            200,
        ]
    },
})
