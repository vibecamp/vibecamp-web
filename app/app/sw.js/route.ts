export const dynamic = 'force-dynamic'

// Browsers that used the previous my.vibe.camp app still have its cache-first service worker
// registered at /sw.js. Serving this replacement deletes those caches and unregisters it, so
// returning visitors get this app instead of the cached old one. Keep through Vibecamp 6.
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
