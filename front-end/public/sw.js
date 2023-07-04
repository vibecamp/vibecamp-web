/* eslint-env serviceworker */

const VERSION = 1
const CACHE_NAME = `my_vibecamp_${VERSION}`

const APP_STATIC_RESOURCES = [
    '/',
    '/index.html',
    '/'
]

self.addEventListener('install', e => {
    e.waitUntil(
        (async () => {
            const cache = await caches.open(CACHE_NAME)
            cache.addAll(APP_STATIC_RESOURCES)
        })()
    )
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

            await clients.claim()
        })()
    )
})