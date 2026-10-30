import { eq } from 'drizzle-orm'
import { z } from 'zod'
import { db } from '@/db'
import * as s from '@/db/schema'

export async function getImage(imageId: string) {
    if (!z.uuid().safeParse(imageId).success) return undefined
    const rows = await db
        .select({ content_type: s.image.content_type, data: s.image.data })
        .from(s.image)
        .where(eq(s.image.image_id, imageId))
    return rows[0]
}
