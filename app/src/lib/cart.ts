import { z } from 'zod'

const quantity = z.number().int().min(1).max(1000)
const addons = z.array(z.strictObject({ purchase_type_id: z.string().min(1), quantity })).max(100)
const common = {
    festival_id: z.uuid(),
    contribution_cents: z.number().int().min(0).max(99_999_999),
}
const cartSchema = z.discriminatedUnion('kind', [
    z.strictObject({
        ...common,
        kind: z.literal('tickets'),
        tickets: z
            .array(z.strictObject({ key: z.uuid(), purchase_type_id: z.string().min(1), addons }))
            .min(1)
            .max(100),
        discount_code: z.string().max(100).nullable(),
    }),
    z.strictObject({
        ...common,
        kind: z.literal('addons'),
        ticket_id: z.uuid(),
        addons: addons.min(1),
    }),
])
export type Cart = z.infer<typeof cartSchema>
export type Product = {
    purchase_type_id: string
    festival_id: string
    description: string
    price_in_cents: number
    is_attendance_ticket: boolean
    sale_enabled: boolean
    hidden_from_ui: boolean
    available_from: string | null
    available_to: string | null
    max_per_ticket: number | null
    sort_order: number
    details: string | null
    additional_info: string | null
    available: number
}
export type Catalog = {
    festival: { festival_id: string; festival_name: string; end_date: string } | null
    products: Product[]
    compatibility: { ticket_type_id: string; addon_type_id: string }[]
    exclusions: { addon_a: string; addon_b: string }[]
}
export type Discount = {
    discount_code_id: string
    percent_bps: number | null
    fixed_cents: number | null
    remaining: number
    ticket_types: string[]
    addon_types: string[]
}
export type QuoteUnit = {
    key: string
    parent_key: string | null
    purchase_type_id: string
    name: string
    details: string | null
    additional_info: string | null
    gross_cents: number
    discount_cents: number
    net_cents: number
}
export type Quote = {
    units: QuoteUnit[]
    contribution_cents: number
    gross_cents: number
    discount_cents: number
    total_cents: number
    discount_code_id: string | null
    discounted_ticket_count: number
    hash: string
}
type CartErrorCode = 'invalid_request' | 'quote_changed' | 'checkout_pending' | 'needs_attention'
export class CartError extends Error {
    constructor(
        public code: CartErrorCode = 'invalid_request',
        public detail?: unknown,
        public status?: 404,
    ) {
        super(code)
    }
}
export function invariant(condition: unknown): asserts condition {
    if (!condition) throw new CartError()
}
export function parseCart(input: unknown): Cart {
    const result = cartSchema.safeParse(input)
    if (!result.success) throw new CartError()
    const cart = result.data
    if (cart.kind === 'tickets')
        cart.discount_code = cart.discount_code?.trim().toUpperCase() || null
    return cart
}
export function contributionCents(value: string): number | null {
    if (value === '') return 0
    if (!/^\d+(\.\d{0,2})?$/.test(value)) return null
    const [whole, fraction = ''] = value.split('.')
    const result = Number(whole) * 100 + Number(fraction.padEnd(2, '0'))
    return Number.isSafeInteger(result) && result <= 99_999_999 ? result : null
}
export function quoteCart(
    cart: Cart,
    catalog: Catalog,
    discount: Discount | null,
    target?: {
        purchase_type_id: string
        existing_addons: { purchase_type_id: string; quantity: number }[]
    },
    today = new Date().toISOString().slice(0, 10),
): Quote {
    const size =
        cart.kind === 'tickets'
            ? cart.tickets.reduce(
                  (n, ticket) =>
                      n + 1 + ticket.addons.reduce((sum, addon) => sum + addon.quantity, 0),
                  0,
              )
            : cart.addons.reduce((n, addon) => n + addon.quantity, 0)
    invariant(size >= 1 && size <= 1000)
    invariant(
        catalog.festival?.festival_id === cart.festival_id && catalog.festival.end_date >= today,
    )
    const products = new Map(catalog.products.map((p) => [p.purchase_type_id, p]))
    const counts = new Map<string, number>()
    const units: QuoteUnit[] = []
    const keys = new Set<string>()
    let discountedTickets = 0
    const product = (id: string, ticket: boolean) => {
        const p = products.get(id)
        invariant(
            p &&
                p.festival_id === cart.festival_id &&
                p.is_attendance_ticket === ticket &&
                p.sale_enabled &&
                !p.hidden_from_ui &&
                (!p.available_from || p.available_from <= today) &&
                (!p.available_to || today < p.available_to) &&
                Number.isSafeInteger(p.price_in_cents) &&
                p.price_in_cents >= 0,
        )
        counts.set(id, (counts.get(id) ?? 0) + 1)
        invariant((counts.get(id) ?? 0) <= p.available)
        return p
    }
    const unit = (p: Product, key: string, parent_key: string | null): QuoteUnit => ({
        key,
        parent_key,
        purchase_type_id: p.purchase_type_id,
        name: p.description,
        details: p.details,
        additional_info: p.additional_info,
        gross_cents: p.price_in_cents,
        discount_cents: 0,
        net_cents: p.price_in_cents,
    })
    const bundles =
        cart.kind === 'tickets'
            ? cart.tickets
            : [
                  {
                      key: cart.ticket_id,
                      purchase_type_id: target?.purchase_type_id ?? '',
                      addons: cart.addons,
                  },
              ]
    for (const ticket of bundles) {
        invariant(!keys.has(ticket.key))
        keys.add(ticket.key)
        const bundle: QuoteUnit[] = []
        if (cart.kind === 'tickets')
            bundle.push(unit(product(ticket.purchase_type_id, true), ticket.key, null))
        else invariant(target && products.get(target.purchase_type_id)?.is_attendance_ticket)
        const selected = new Map<string, number>()
        for (const addon of ticket.addons) {
            invariant(!selected.has(addon.purchase_type_id))
            selected.set(addon.purchase_type_id, addon.quantity)
        }
        const combined = new Map(selected)
        if (cart.kind === 'addons')
            for (const old of target?.existing_addons ?? [])
                combined.set(
                    old.purchase_type_id,
                    (combined.get(old.purchase_type_id) ?? 0) + old.quantity,
                )
        for (const [id, n] of selected) {
            invariant(
                catalog.compatibility.some(
                    (r) => r.ticket_type_id === ticket.purchase_type_id && r.addon_type_id === id,
                ),
            )
            const cap = products.get(id)?.max_per_ticket
            invariant(cap == null || (combined.get(id) ?? 0) <= cap)
            for (let i = 0; i < n; i++)
                bundle.push(unit(product(id, false), `${ticket.key}:${id}:${i}`, ticket.key))
        }
        invariant(
            !catalog.exclusions.some((r) => combined.has(r.addon_a) && combined.has(r.addon_b)),
        )
        bundle.sort(
            (a, b) =>
                Number(a.parent_key !== null) - Number(b.parent_key !== null) ||
                (products.get(a.purchase_type_id)?.sort_order ?? 0) -
                    (products.get(b.purchase_type_id)?.sort_order ?? 0) ||
                a.purchase_type_id.localeCompare(b.purchase_type_id),
        )
        if (cart.kind === 'tickets' && discount?.ticket_types.includes(ticket.purchase_type_id)) {
            let remainder = discount.fixed_cents ?? 0
            for (const u of bundle) {
                if (u.parent_key !== null && !discount.addon_types.includes(u.purchase_type_id))
                    continue
                if (discount.percent_bps !== null)
                    u.net_cents = Math.floor(
                        (u.gross_cents * (10000 - discount.percent_bps) + 5000) / 10000,
                    )
                else {
                    u.net_cents = Math.max(0, u.gross_cents - remainder)
                    remainder -= u.gross_cents - u.net_cents
                }
                u.discount_cents = u.gross_cents - u.net_cents
            }
            if (bundle.some((u) => u.discount_cents > 0)) discountedTickets++
        }
        units.push(...bundle)
    }
    invariant(units.length <= 1000)
    if (cart.kind === 'tickets' && cart.discount_code)
        invariant(discount && discountedTickets > 0 && discountedTickets <= discount.remaining)
    const gross = units.reduce((n, u) => n + u.gross_cents, 0)
    const reduction = units.reduce((n, u) => n + u.discount_cents, 0)
    const total = gross - reduction + cart.contribution_cents
    invariant(total <= 99_999_999 && (total === 0 || total >= 50))
    invariant(
        new Set(units.map((u) => JSON.stringify([u.purchase_type_id, u.name, u.net_cents]))).size +
            Number(cart.contribution_cents > 0) <=
            100,
    )
    return {
        units,
        contribution_cents: cart.contribution_cents,
        gross_cents: gross,
        discount_cents: reduction,
        total_cents: total,
        discount_code_id: cart.kind === 'tickets' ? (discount?.discount_code_id ?? null) : null,
        discounted_ticket_count: discountedTickets,
        hash: '',
    }
}
export const badgeSchema = z.strictObject({
    badge_name: z.string().trim().min(1).max(20),
    badge_username: z
        .string()
        .max(20)
        .refine((v) => !v.startsWith('@'))
        .nullable(),
    badge_location: z.string().max(20).nullable(),
    badge_bio: z.string().max(160).nullable(),
    badge_picture_url: z
        .string()
        .refine((v) => v === '' || (/^https?:\/\//.test(v) && URL.canParse(v)))
        .nullable(),
    badge_picture_image_id: z.null(),
})
export type Badge = z.infer<typeof badgeSchema>
