import { describe, expect, it } from 'vitest'
import { hashToPath } from '@/lib/hash-redirect'

const encoded = (state: Record<string, unknown>) => `#${encodeURIComponent(JSON.stringify(state))}`

const cases: ReadonlyArray<[label: string, hash: string, expected: string | null]> = [
    ['no hash', '', null],
    ['an ordinary anchor', '#section-2', null],
    ['truncated JSON', '#{"currentView":', null],
    ['a JSON array', '#%5B%22Events%22%5D', null],

    [
        'a password-reset link from the old email',
        encoded({ passwordResetSecret: 'abc' }),
        '/reset-password?secret=abc',
    ],
    [
        'the reset secret wins over the rest of the state',
        encoded({ currentView: 'Events', viewingEventDetails: 'x', passwordResetSecret: 's3cr3t' }),
        '/reset-password?secret=s3cr3t',
    ],

    ['a shared event link', encoded({ viewingEventDetails: 'abc-123' }), '/events/abc-123'],
    [
        'the event id is percent-encoded',
        encoded({ viewingEventDetails: 'a b/c' }),
        '/events/a%20b%2Fc',
    ],

    ['the purchase modal', encoded({ ticketPurchaseModalState: 'fest-1' }), '/tickets/fest-1/buy'],
    ['a finished purchase', encoded({ ticketPurchaseModalState: 'payment' }), '/tickets'],

    ['empty state goes to the default tab', encoded({}), '/tickets'],
    ['currentView Events', encoded({ currentView: 'Events' }), '/events'],
    ['currentView Map', encoded({ currentView: 'Map' }), '/tickets'],
    [
        'an unknown currentView goes to the default tab',
        encoded({ currentView: 'Info' }),
        '/tickets',
    ],

    [
        'filter and compact together',
        encoded({ currentView: 'Events', eventsFilter: 'Past', compactEventsView: true }),
        '/events?filter=Past&compact=1',
    ],
    [
        'an unknown eventsFilter is dropped',
        encoded({ currentView: 'Events', eventsFilter: 'Nope' }),
        '/events',
    ],
    [
        'eventsFilter is ignored on other tabs',
        encoded({ currentView: 'Tickets', eventsFilter: 'Mine' }),
        '/tickets',
    ],

    [
        'empty strings are ignored',
        encoded({ currentView: '', viewingEventDetails: '' }),
        '/tickets',
    ],
    [
        'non-string values are ignored',
        encoded({ currentView: null, viewingEventDetails: 123 }),
        '/tickets',
    ],
]

describe('hashToPath', () => {
    it.each(cases)('%s', (_label, hash, expected) => {
        expect(hashToPath(hash)).toBe(expected)
    })
})
