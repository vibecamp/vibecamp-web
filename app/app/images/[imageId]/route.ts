import { getImage } from '@/server/images'

export const dynamic = 'force-dynamic'

export async function GET(_req: Request, { params }: { params: Promise<{ imageId: string }> }) {
    const image = await getImage((await params).imageId)
    if (!image) {
        return new Response(null, { status: 404, headers: { 'Cache-Control': 'no-store' } })
    }
    return new Response(new Uint8Array(image.data), {
        headers: {
            'Content-Type': image.content_type,
            // image rows are never edited; a replacement is a new row with a new id
            'Cache-Control': 'public, max-age=31536000, immutable',
            'X-Content-Type-Options': 'nosniff',
        },
    })
}
