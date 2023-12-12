/* eslint-env serviceworker */

//  BUNDLE_HASH is injected via build.js
// eslint-disable-next-line no-undef
const VERSION = BUNDLE_HASH // ensures that if anything in app.js changes, we get a new sw.js
const CACHE_NAME = `my_vibecamp_${VERSION}`

const APP_STATIC_RESOURCES = [
    '/',
    '/index.html',
    '/favicon.ico',
    '/app.css',
    '/app.js',
    '/leaflet.css',
    '/loading-spinner.gif',
    '/twitter.png',
    '/vibecamp.png',
    '/vibecamp-squircle.png',
    '/swirl1.png',
    '/swirl2.png',
    '/icons.woff2',
    '/roboto-300.woff2',
    '/roboto-500.woff2',
    '/roboto-700.woff2'
]

self.addEventListener('install', e => {
    e.waitUntil(
        (async () => {
            const cache = await caches.open(CACHE_NAME)
            await cache.addAll(APP_STATIC_RESOURCES)
        })()
    )
})

self.addEventListener('fetch', async e => {
    e.respondWith((async () => {
        if (
            e.request.destination === 'script' ||
            e.request.destination === 'style' ||
            e.request.destination === 'document' ||
            e.request.destination === 'font' ||
            e.request.destination === 'image'
        ) {
            return await caches.match(e.request) ?? await fetch(e.request)
        } else {
            return await fetch(e.request)
        }
    })())
})

self.addEventListener('activate', e => {
    e.waitUntil(
        (async () => {
            const keys = await caches.keys()

            await Promise.all(
                keys.map(name => {
                    if (name !== CACHE_NAME) {
                        return caches.delete(name)
                    }
                })
            )

            // await clients.claim()
        })()
    )
})

export { }