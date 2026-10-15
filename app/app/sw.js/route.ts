export const dynamic = 'force-dynamic'

// Unregisters the old app's cache-first worker so returning visitors stop getting the cached old app; keep through Vibecamp 6
const SELF_DESTRUCT = `self.addEventListener('install', () => self.skipWaiting())
self.addEventListener('activate', (event) => {
    event.waitUntil((async () => {
        for (const key of await caches.keys()) await caches.delete(key)
        await self.registration.unregister()
        for (const client of await self.clients.matchAll({ type: 'window' })) client.navigate(client.url)
    })())
})
`

export function GET() {
    return new Response(SELF_DESTRUCT, {
        headers: { 'Content-Type': 'application/javascript', 'Cache-Control': 'no-cache' },
    })
}
