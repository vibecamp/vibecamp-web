import { eq } from 'drizzle-orm'
import { expect, it } from 'vitest'
import { db } from '@/db'
import * as s from '@/db/schema'
import { GET } from '../app/images/[imageId]/route'

const PNG = Buffer.from(
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
    'base64',
)

const get = (imageId: string) =>
    GET(new Request(`http://localhost/images/${imageId}`), {
        params: Promise.resolve({ imageId }),
    })

it('serves stored images with long-lived caching and 404s anything else', async () => {
    const image = (
        await db
            .insert(s.image)
            .values({ content_type: 'image/png', width: 1, height: 1, data: PNG })
            .returning({ image_id: s.image.image_id })
    )[0]
    if (!image) throw new Error('image insert returned nothing')
    try {
        const res = await get(image.image_id)
        expect(res.status).toBe(200)
        expect(res.headers.get('content-type')).toBe('image/png')
        expect(res.headers.get('cache-control')).toContain('immutable')
        expect(Buffer.from(await res.arrayBuffer()).equals(PNG)).toBe(true)
        expect((await get('00000000-0000-4000-8000-000000000000')).status).toBe(404)
        expect((await get('not-a-uuid')).status).toBe(404)
    } finally {
        await db.delete(s.image).where(eq(s.image.image_id, image.image_id))
    }
})
