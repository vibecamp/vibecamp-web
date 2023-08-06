/* eslint-env serviceworker */

// @ts-check
/// <reference no-default-lib="true"/>
/// <reference lib="webworker" />

// Default type of `self` is `WorkerGlobalScope & typeof globalThis`
// https://github.com/microsoft/TypeScript/issues/14877
declare let self: ServiceWorkerGlobalScope

const VERSION = 1
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

// self.addEventListener('activate', e => {
//     e.waitUntil(
//         (async () => {
//             const keys = await caches.keys()

//             await Promise.all(
//                 keys.map(name => {
//                     if (name !== CACHE_NAME) {
//                         return caches.delete(name)
//                     }
//                 })
//             )

//             await clients.claim()
//         })()
//     )
// })

export { }