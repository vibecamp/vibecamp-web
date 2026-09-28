import { describe, expect, it } from 'vitest'
import {
    badgeSchema,
    type Cart,
    type Catalog,
    contributionCents,
    type Discount,
    type Product,
    parseCart,
    quoteCart,
} from '@/lib/cart'

const festival = '22222222-2222-4222-8222-222222222030'
const key = '88888888-8888-4888-8888-888888888888'
const product = (id: string, price: number, ticket = true, cap: number | null = 1): Product => ({
    purchase_type_id: id,
    festival_id: festival,
    description: id,
    price_in_cents: price,
    is_attendance_ticket: ticket,
    sale_enabled: true,
    hidden_from_ui: false,
    available_from: null,
    available_to: null,
    max_per_ticket: cap,
    sort_order: 0,
    details: null,
    additional_info: null,
    available: 1000,
})
const catalog: Catalog = {
    festival: { festival_id: festival, festival_name: 'Test', end_date: '2099-01-01' },
    products: [
        product('tent', 10000),
        product('cabin', 15000),
        product('infant', 0),
        product('youth', 5000),
        product('sleeping', 1000, false, 2),
        product('bedding', 2000, false),
        product('bus', 3000, false, 2),
    ],
    compatibility: [
        ['tent', 'sleeping'],
        ['tent', 'bus'],
        ['cabin', 'sleeping'],
        ['cabin', 'bedding'],
        ['cabin', 'bus'],
        ['youth', 'sleeping'],
        ['youth', 'bus'],
    ].map(([ticket_type_id, addon_type_id]) => ({
        ticket_type_id: ticket_type_id ?? '',
        addon_type_id: addon_type_id ?? '',
    })),
    exclusions: [{ addon_a: 'bedding', addon_b: 'sleeping' }],
}
const cart = (
    type = 'tent',
    addons: string[] = [],
): Extract<
    Cart,
    {
        kind: 'tickets'
    }
> => ({
    kind: 'tickets',
    festival_id: festival,
    tickets: [
        {
            key,
            purchase_type_id: type,
            addons: addons.map((purchase_type_id) => ({ purchase_type_id, quantity: 1 })),
        },
    ],
    discount_code: null,
    contribution_cents: 0,
})
const fixed: Discount = {
    discount_code_id: key,
    fixed_cents: 12000,
    percent_bps: null,
    remaining: 10,
    ticket_types: ['tent'],
    addon_types: ['sleeping'],
}
describe('cart pricing and compatibility', () => {
    it.each([
        ['tent', ['sleeping'], 11000],
        ['cabin', ['sleeping'], 16000],
        ['cabin', ['bedding'], 17000],
        ['cabin', ['bedding', 'bus'], 20000],
        ['cabin', ['bus'], 18000],
        ['infant', [], 0],
        ['youth', ['bus'], 8000],
        ['youth', ['sleeping'], 6000],
    ] as const)('prices %s with %j', (type, addons, total) => {
        expect(quoteCart(cart(type, [...addons]), catalog, null).total_cents).toBe(total)
    })
    it.each([
        ['tent', ['bedding']],
        ['cabin', ['bedding', 'sleeping']],
        ['infant', ['bus']],
    ] as const)('rejects %s with %j', (type, addons) => {
        expect(() => quoteCart(cart(type, [...addons]), catalog, null)).toThrow()
    })
    it('discards fixed discount remainder and prices later addons at full price', () => {
        const initial = { ...cart('tent', ['sleeping']), discount_code: 'FIXED120' }
        const quote = quoteCart(initial, catalog, fixed)
        expect(quote.total_cents).toBe(0)
        expect(quote.discount_cents).toBe(11000)
        expect(quote.discounted_ticket_count).toBe(1)
        const later = quoteCart(
            {
                kind: 'addons',
                festival_id: festival,
                ticket_id: key,
                addons: [{ purchase_type_id: 'bus', quantity: 1 }],
                contribution_cents: 0,
            },
            catalog,
            fixed,
            {
                purchase_type_id: 'tent',
                existing_addons: [{ purchase_type_id: 'sleeping', quantity: 1 }],
            },
        )
        expect(later.total_cents).toBe(3000)
        expect(later.discount_cents).toBe(0)
        expect(later.discount_code_id).toBeNull()
        expect(later.discounted_ticket_count).toBe(0)
    })
    it('counts code uses per positively discounted eligible ticket and never discounts contributions', () => {
        const input = cart('tent', ['bus'])
        input.tickets.push({
            key: '88888888-8888-4888-8888-888888888889',
            purchase_type_id: 'cabin',
            addons: [],
        })
        input.discount_code = 'HALF'
        input.contribution_cents = 1234
        const quote = quoteCart(input, catalog, { ...fixed, fixed_cents: null, percent_bps: 5000 })
        expect(quote.total_cents).toBe(24234)
        expect(quote.discounted_ticket_count).toBe(1)
    })
    it('rounds each eligible unit to integer cents', () => {
        const custom = { ...catalog, products: [product('tent', 101)] }
        expect(
            quoteCart({ ...cart(), discount_code: 'HALF' }, custom, {
                ...fixed,
                fixed_cents: null,
                percent_bps: 5000,
            }).total_cents,
        ).toBe(51)
    })
    it('rejects the entire discount when uses are insufficient', () => {
        const input = { ...cart(), discount_code: 'CODE' }
        input.tickets.push({
            ...required(input.tickets[0]),
            key: '88888888-8888-4888-8888-888888888889',
        })
        expect(() => quoteCart(input, catalog, { ...fixed, remaining: 1 })).toThrow()
    })
    it('does not count a free ticket as a code use', () => {
        expect(() =>
            quoteCart({ ...cart('infant'), discount_code: 'CODE' }, catalog, {
                ...fixed,
                ticket_types: ['infant'],
            }),
        ).toThrow()
    })
    it.each([
        { sale_enabled: false },
        { hidden_from_ui: true },
        { available: 0 },
        { available_from: '2099-01-01' },
        { available_to: '2000-01-01' },
        { price_in_cents: -1 },
    ])('rejects unavailable products %j', (change) => {
        expect(() =>
            quoteCart(
                cart(),
                { ...catalog, products: [{ ...product('tent', 10000), ...change }] },
                null,
            ),
        ).toThrow()
    })
    it('fails closed without an active festival or after the festival', () => {
        expect(() => quoteCart(cart(), { ...catalog, festival: null }, null)).toThrow()
        expect(() =>
            quoteCart(
                cart(),
                { ...catalog, festival: { ...required(catalog.festival), end_date: '2000-01-01' } },
                null,
            ),
        ).toThrow()
    })
    it('includes already-owned addons in caps and exclusions', () => {
        const input: Cart = {
            kind: 'addons',
            festival_id: festival,
            ticket_id: key,
            addons: [{ purchase_type_id: 'sleeping', quantity: 1 }],
            contribution_cents: 0,
        }
        expect(() =>
            quoteCart(input, catalog, null, {
                purchase_type_id: 'cabin',
                existing_addons: [{ purchase_type_id: 'bedding', quantity: 1 }],
            }),
        ).toThrow()
        expect(() =>
            quoteCart(input, catalog, null, {
                purchase_type_id: 'tent',
                existing_addons: [{ purchase_type_id: 'sleeping', quantity: 2 }],
            }),
        ).toThrow()
    })
    it('allows unlimited per-ticket caps while retaining cart safety limits', () => {
        const input = cart('tent')
        required(input.tickets[0]).addons = [{ purchase_type_id: 'sleeping', quantity: 20 }]
        expect(
            quoteCart(
                input,
                {
                    ...catalog,
                    products: catalog.products.map((p) => ({ ...p, max_per_ticket: null })),
                },
                null,
            ).units,
        ).toHaveLength(21)
    })
    it('rejects duplicate ticket keys and duplicate addon selections', () => {
        const input = cart()
        input.tickets.push(required(input.tickets[0]))
        expect(() => quoteCart(input, catalog, null)).toThrow()
        expect(() => quoteCart(cart('tent', ['sleeping', 'sleeping']), catalog, null)).toThrow()
    })
    it.each([0, 49, 50, 99999999, 100000000])(
        'enforces Stripe total bounds at %i cents',
        (price) => {
            const run = () =>
                quoteCart(cart(), { ...catalog, products: [product('tent', price)] }, null)
            if (price === 49 || price === 100000000) expect(run).toThrow()
            else expect(run().total_cents).toBe(price)
        },
    )
})
describe('strict input and badge validation', () => {
    it('rejects discount fields on later addon purchases', () => {
        expect(() =>
            parseCart({
                kind: 'addons',
                festival_id: festival,
                ticket_id: key,
                addons: [{ purchase_type_id: 'bus', quantity: 1 }],
                contribution_cents: 0,
                discount_code: 'CODE',
            }),
        ).toThrow()
    })
    it('normalizes initial codes', () => {
        expect(parseCart({ ...cart(), discount_code: '  lowincome ' })).toMatchObject({
            discount_code: 'LOWINCOME',
        })
    })
    it.each([-1, 0.5, 1001, NaN])('rejects invalid quantity %s', (n) => {
        const input = cart('tent')
        required(input.tickets[0]).addons = [{ purchase_type_id: 'bus', quantity: n }]
        expect(() => parseCart(input)).toThrow()
    })
    it.each([
        ['', 0],
        ['1', 100],
        ['1.23', 123],
        ['0.01', 1],
        ['1.234', null],
        ['-1', null],
        ['1e2', null],
        ['1000000', null],
    ])('parses contribution %s', (value, expected) => {
        expect(contributionCents(String(value))).toBe(expected)
    })
    const badge = {
        badge_name: 'Name',
        badge_username: null,
        badge_location: null,
        badge_bio: null,
        badge_picture_url: null,
        badge_picture_image_id: null,
    }
    it.each([
        { badge_name: ' ' },
        { badge_name: 'a'.repeat(21) },
        { badge_username: '@name' },
        { badge_location: 'a'.repeat(21) },
        { badge_bio: 'a'.repeat(161) },
        { badge_picture_url: 'javascript:alert(1)' },
        { badge_picture_image_id: key },
    ])('rejects invalid badge %j', (change) => {
        expect(badgeSchema.safeParse({ ...badge, ...change }).success).toBe(false)
    })
    it('accepts a minimal badge with no account profile', () => {
        expect(badgeSchema.safeParse(badge).success).toBe(true)
    })
})
function required<T>(value: T | null | undefined): T {
    if (value == null) throw new Error('Missing test fixture')
    return value
}
