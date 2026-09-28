import { recordStripeWebhook } from '@/server/purchase'

export const dynamic = 'force-dynamic'

export async function POST(req: Request) {
    const status = await recordStripeWebhook(await req.text(), req.headers.get('stripe-signature'))
    return new Response(null, { status })
}
