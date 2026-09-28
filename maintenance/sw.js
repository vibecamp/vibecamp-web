/* eslint-env serviceworker */

// Self-destructing service worker.
//
// front-end/src/sw.js once cached the whole app (documents, scripts, styles,
// fonts, images) and installed PWAs may still hold that worker. Browsers
// re-fetch /sw.js on navigation and install whatever they find, so this file
// is served at /sw.js by the maintenance build and by the new app. It:
//
//   1. takes over immediately (skipWaiting),
//   2. deletes every cache the old worker created,
//   3. unregisters itself, and
//   4. reloads every open window so it loads fresh from the network,
//      uncontrolled by any service worker.
//
// It has no fetch handler, so while it is alive requests go straight to
// the network.

self.addEventListener('install', () => {
    self.skipWaiting()
})

self.addEventListener('activate', event => {
    event.waitUntil(
        (async () => {
            const cacheNames = await caches.keys()
            await Promise.all(cacheNames.map(name => caches.delete(name)))

            // Take control of windows the old worker did not control, so
            // navigate() below is allowed on all of them.
            await self.clients.claim()
            const windows = await self.clients.matchAll({ type: 'window' })

            await self.registration.unregister()

            await Promise.all(
                windows.map(client => client.navigate(client.url).catch(() => undefined))
            )
        })()
    )
})
