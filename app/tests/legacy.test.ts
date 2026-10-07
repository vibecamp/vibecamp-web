// Guarantees to people and data from before the October 2026 rewrite. These check that legacy
// support still exists, not how the current app does things, so change the app freely.

import { readdirSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { expect, it } from 'vitest'
import { hashToPath } from '@/lib/hash-redirect'
import { GET as serviceWorker } from '../app/sw.js/route'

it('verifies passwords stored in the existing account hash format', async () => {
    const { authenticatePassword } = await import('@/server/auth')
    const stored = {
        password_salt: 'b3a4b3c8-6f7e-4d9a-9c1d-2b4f5e6a7b8c',
        password_hash: '$2a$10$38FZl6ioT9LaC1Y0e3CCOOuhWcZhkDmltOwfFs/57AcIKFebOkwgy',
    }
    expect(await authenticatePassword(stored, 'password')).toBe(true)
    expect(await authenticatePassword(stored, 'wrong-password')).toBe(false)
})

it('sends links from the old app to a real page with the same event or festival', () => {
    const pages = readdirSync(fileURLToPath(new URL('../app', import.meta.url)), {
        recursive: true,
        encoding: 'utf8',
    })
        .filter((file) => file.endsWith('page.tsx'))
        .map((file) => {
            const segments = file
                .split('/')
                .slice(0, -1)
                .filter((s) => !s.startsWith('('))
                .map((s) => (s.startsWith('[') ? '[^/]+' : s))
            return new RegExp(`^/${segments.join('/')}$`)
        })

    // The old app kept its state in the URL hash in exactly this form.
    const oldLink = (state: Record<string, string>) =>
        `#${encodeURIComponent(JSON.stringify(state))}`
    const event = '9c1f6a52-3b7e-4d2a-8f0e-5a6b7c8d9e01'
    const festival = '22222222-2222-4222-8222-222222222030'
    const links = [
        { hash: oldLink({ currentView: 'Events', viewingEventDetails: event }), keeps: event },
        {
            hash: oldLink({ currentView: 'Tickets', ticketPurchaseModalState: festival }),
            keeps: festival,
        },
        ...['Tickets', 'Events', 'Map', 'Account'].map((view) => ({
            hash: oldLink({ currentView: view }),
            keeps: null,
        })),
    ]

    for (const { hash, keeps } of links) {
        const path = hashToPath(hash) ?? ''
        const pathname = path.split('?')[0] ?? ''
        expect(
            pages.some((page) => page.test(pathname)),
            `${decodeURIComponent(hash)} -> ${path}`,
        ).toBe(true)
        if (keeps) expect(path).toContain(keeps)
    }
})

// Remove together with app/sw.js/route.ts after Vibecamp 6.
it('serves a /sw.js that clears and unregisters the old app service worker', async () => {
    const res = serviceWorker()
    expect(res.status).toBe(200)
    expect(res.headers.get('Content-Type')).toContain('javascript')
    const script = await res.text()
    expect(script).toContain('caches.delete')
    expect(script).toContain('registration.unregister()')
})
