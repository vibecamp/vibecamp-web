export const dynamic = 'force-dynamic'

export function GET() {
    return new Response('OK', { headers: { 'Content-Type': 'text/plain' } })
}
