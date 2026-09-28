import { createHash, randomUUID } from 'node:crypto'
import { and, eq, inArray, sql } from 'drizzle-orm'
import type Stripe from 'stripe'
import { z } from 'zod'
import { t } from '@/copy/t'
import { db } from '@/db'
import * as s from '@/db/schema'
import { env, usingStripeTestKey } from '@/env'
import {
    CartError,
    type Catalog,
    type Discount,
    invariant,
    parseCart,
    type Quote,
    quoteCart,
} from '@/lib/cart'
import { orderReceiptEmail, sendMail } from './mail'
import { stripe } from './stripe'

export async function purchaseCatalog(accountId: string): Promise<Catalog> {
    const festivals = await db.select().from(s.festival).where(eq(s.festival.sales_are_open, true))
    if (festivals.length > 1) throw new CartError('needs_attention')
    const festival = festivals[0] ?? null
    if (!festival) return { festival: null, products: [], compatibility: [], exclusions: [] }
    const [products, counts, compatibility, exclusions] = await Promise.all([
        db
            .select()
            .from(s.purchase_type)
            .where(eq(s.purchase_type.festival_id, festival.festival_id)),
        db
            .select({
                id: s.purchase.purchase_type_id,
                total: sql<number>`count(*)::int`,
                owned: sql<number>`count(*) filter (where ${s.purchase.owned_by_account_id} = ${accountId})::int`,
            })
            .from(s.purchase)
            .groupBy(s.purchase.purchase_type_id),
        db.select().from(s.purchase_type_addon),
        db.select().from(s.purchase_type_addon_exclusion),
    ])
    return {
        festival,
        compatibility: compatibility.filter((r) =>
            products.some((p) => p.purchase_type_id === r.ticket_type_id),
        ),
        exclusions: exclusions.filter((r) =>
            products.some((p) => p.purchase_type_id === r.addon_a),
        ),
        products: products.map(({ low_income_only: _, max_available, max_per_account, ...p }) => {
            const n = counts.find((c) => c.id === p.purchase_type_id)
            return {
                ...p,
                available:
                    !p.sale_enabled ||
                    p.hidden_from_ui ||
                    festival.end_date < new Date().toISOString().slice(0, 10) ||
                    (p.available_from !== null &&
                        p.available_from > new Date().toISOString().slice(0, 10)) ||
                    (p.available_to !== null &&
                        p.available_to <= new Date().toISOString().slice(0, 10))
                        ? 0
                        : Math.max(
                              0,
                              Math.min(
                                  max_available == null ? 1000 : max_available - (n?.total ?? 0),
                                  max_per_account == null
                                      ? 1000
                                      : max_per_account - (n?.owned ?? 0),
                              ),
                          ),
            }
        }),
    }
}

export async function purchaseQuote(accountId: string, input: unknown) {
    const cart = parseCart(input)
    const catalog = await purchaseCatalog(accountId)
    let discount: Discount | null = null
    let target:
        | {
              purchase_type_id: string
              existing_addons: { purchase_type_id: string; quantity: number }[]
          }
        | undefined
    if (cart.kind === 'addons') {
        const ticket = (
            await db
                .select()
                .from(s.purchase)
                .where(
                    and(
                        eq(s.purchase.purchase_id, cart.ticket_id),
                        eq(s.purchase.owned_by_account_id, accountId),
                    ),
                )
        )[0]
        if (!ticket) throw new CartError('invalid_request', undefined, 404)
        invariant(!ticket.parent_purchase_id)
        const existing = await db
            .select()
            .from(s.purchase)
            .where(eq(s.purchase.parent_purchase_id, cart.ticket_id))
        target = {
            purchase_type_id: ticket.purchase_type_id,
            existing_addons: existing.map((p) => ({
                purchase_type_id: p.purchase_type_id,
                quantity: 1,
            })),
        }
    } else if (cart.discount_code) {
        const code = (
            await db
                .select()
                .from(s.discount_code)
                .where(
                    and(
                        eq(s.discount_code.festival_id, cart.festival_id),
                        eq(s.discount_code.code, cart.discount_code),
                    ),
                )
        )[0]
        const now = Date.now()
        invariant(
            code?.enabled &&
                (!code.starts_at || Date.parse(code.starts_at) <= now) &&
                (!code.ends_at || now < Date.parse(code.ends_at)),
        )
        const [bases, addons, usage] = await Promise.all([
            db
                .select()
                .from(s.discount_code_ticket_type)
                .where(eq(s.discount_code_ticket_type.discount_code_id, code.discount_code_id)),
            db
                .select()
                .from(s.discount_code_addon_type)
                .where(eq(s.discount_code_addon_type.discount_code_id, code.discount_code_id)),
            db
                .select({
                    n: sql<number>`coalesce(sum(${s.checkout_order.discounted_ticket_count}), 0)::int`,
                })
                .from(s.checkout_order)
                .where(
                    and(
                        eq(s.checkout_order.discount_code_id, code.discount_code_id),
                        eq(s.checkout_order.status, 'fulfilled'),
                    ),
                ),
        ])
        discount = {
            ...code,
            remaining: code.max_uses == null ? 1000 : code.max_uses - (usage[0]?.n ?? 0),
            ticket_types: bases.map((p) => p.purchase_type_id),
            addon_types: addons.map((p) => p.purchase_type_id),
        }
    }
    const quote = quoteCart(cart, catalog, discount, target)
    quote.hash = createHash('sha256').update(JSON.stringify({ cart, quote })).digest('hex')
    return { cart, quote }
}

type Order = typeof s.checkout_order.$inferSelect
export type OrderStatus = {
    order_id: string
    status: 'pending' | 'fulfilled' | 'closed'
    needs_attention: boolean
    resume_url: string | null
}
const statusOf = (o: Order): OrderStatus => ({
    order_id: o.checkout_order_id,
    status: o.status as OrderStatus['status'],
    needs_attention: o.needs_attention,
    resume_url: o.status === 'pending' && !o.needs_attention ? o.stripe_url : null,
})
function stable(value: unknown): string {
    if (Array.isArray(value)) return `[${value.map(stable).join(',')}]`
    if (value !== null && typeof value === 'object')
        return `{${Object.entries(value)
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([k, v]) => `${JSON.stringify(k)}:${stable(v)}`)
            .join(',')}}`
    return JSON.stringify(value)
}
async function startSession(order: Order) {
    if (order.status !== 'pending') throw new CartError('checkout_pending', statusOf(order))
    if (order.needs_attention) throw new CartError('needs_attention')
    if (order.stripe_url) return { order_id: order.checkout_order_id, url: order.stripe_url }
    // Stripe may forget idempotency keys after 24 hours; never risk a second charge.
    if (Date.now() - Date.parse(order.created_at) >= 86400000) {
        await db
            .update(s.checkout_order)
            .set({ needs_attention: true })
            .where(eq(s.checkout_order.checkout_order_id, order.checkout_order_id))
        throw new CartError('needs_attention')
    }
    try {
        const session = await stripe.checkout.sessions.create(
            order.stripe_params as Stripe.Checkout.SessionCreateParams,
            { idempotencyKey: order.checkout_order_id },
        )
        if (!session.url) throw new Error('Checkout returned no URL')
        await db
            .update(s.checkout_order)
            .set({ stripe_session_id: session.id, stripe_url: session.url })
            .where(eq(s.checkout_order.checkout_order_id, order.checkout_order_id))
        return { order_id: order.checkout_order_id, url: session.url }
    } catch (error) {
        if (
            error instanceof Error &&
            [
                'StripeInvalidRequestError',
                'StripeAuthenticationError',
                'StripePermissionError',
            ].includes(error.constructor.name)
        ) {
            await db
                .update(s.checkout_order)
                .set({ needs_attention: true })
                .where(eq(s.checkout_order.checkout_order_id, order.checkout_order_id))
            console.error('Checkout needs attention', order.checkout_order_id, error)
            throw new CartError('needs_attention')
        }
        console.error('Checkout creation deferred', order.checkout_order_id, error)
        throw new CartError('checkout_pending', statusOf(order))
    }
}

export async function createCheckoutSession(accountId: string, input: unknown) {
    const parsed = z
        .strictObject({
            cart: z.unknown(),
            quote_hash: z.string(),
            request_id: z.uuid(),
            accepted_terms: z.literal(true),
        })
        .safeParse(input)
    invariant(parsed.success)
    const body = parsed.data
    const cart = parseCart(body.cart)
    const existing = (
        await db
            .select()
            .from(s.checkout_order)
            .where(
                and(
                    eq(s.checkout_order.account_id, accountId),
                    eq(s.checkout_order.request_id, body.request_id),
                ),
            )
    )[0]
    if (existing) {
        invariant(stable(existing.cart) === stable(cart))
        return startSession(existing)
    }
    const { quote } = await purchaseQuote(accountId, cart)
    if (quote.hash !== body.quote_hash) throw new CartError('quote_changed', quote)
    const account = (
        await db.select().from(s.account).where(eq(s.account.account_id, accountId))
    )[0]
    invariant(account)
    const id = randomUUID()
    const grouped = new Map<string, { name: string; price: number; quantity: number }>()
    for (const u of quote.units) {
        const key = JSON.stringify([u.purchase_type_id, u.name, u.net_cents])
        const row = grouped.get(key)
        if (row) row.quantity++
        else grouped.set(key, { name: u.name, price: u.net_cents, quantity: 1 })
    }
    if (quote.contribution_cents)
        grouped.set('contribution', {
            name: t('purchase.contributionLabel'),
            price: quote.contribution_cents,
            quantity: 1,
        })
    const origin =
        cart.kind === 'tickets'
            ? `/tickets/${cart.festival_id}/buy`
            : `/tickets/owned/${cart.ticket_id}/addons`
    const params: Stripe.Checkout.SessionCreateParams = {
        mode: 'payment',
        payment_method_types: ['card'],
        customer_email: account.email_address,
        client_reference_id: id,
        metadata: { order_id: id, account_id: accountId },
        line_items: [...grouped.values()].map((p) => ({
            quantity: p.quantity,
            price_data: { currency: 'usd', unit_amount: p.price, product_data: { name: p.name } },
        })),
        success_url: `${env.APP_BASE_URL}/tickets/checkout/return?order_id=${id}`,
        cancel_url: `${env.APP_BASE_URL}${origin}?order_id=${id}&canceled=1`,
        expires_at: Math.floor(Date.now() / 1000) + 3600,
    }
    const order = await db.transaction(async (tx) => {
        await tx.select().from(s.account).where(eq(s.account.account_id, accountId)).for('update')
        const duplicate = (
            await tx
                .select()
                .from(s.checkout_order)
                .where(
                    and(
                        eq(s.checkout_order.account_id, accountId),
                        eq(s.checkout_order.request_id, body.request_id),
                    ),
                )
        )[0]
        if (duplicate) {
            invariant(stable(duplicate.cart) === stable(cart))
            return duplicate
        }
        if (cart.kind === 'addons') {
            const pending = (
                await tx
                    .select()
                    .from(s.checkout_order)
                    .where(
                        and(
                            eq(s.checkout_order.target_ticket_id, cart.ticket_id),
                            eq(s.checkout_order.status, 'pending'),
                        ),
                    )
            )[0]
            if (pending) throw new CartError('checkout_pending', statusOf(pending))
        }
        return (
            await tx
                .insert(s.checkout_order)
                .values({
                    checkout_order_id: id,
                    account_id: accountId,
                    festival_id: cart.festival_id,
                    target_ticket_id: cart.kind === 'addons' ? cart.ticket_id : null,
                    request_id: body.request_id,
                    cart,
                    quote,
                    stripe_params: params,
                    discount_code_id: quote.discount_code_id,
                    discounted_ticket_count: quote.discounted_ticket_count,
                })
                .returning()
        )[0]
    })
    invariant(order)
    return startSession(order)
}

export async function reconcileSession(
    session: Stripe.Checkout.Session,
    eventId?: string,
    failed = false,
) {
    const id = session.metadata?.order_id
    if (!id || !z.uuid().safeParse(id).success) return
    const receipt = await db.transaction(async (tx) => {
        const order = (
            await tx
                .select()
                .from(s.checkout_order)
                .where(eq(s.checkout_order.checkout_order_id, id))
                .for('update')
        )[0]
        if (!order || order.status === 'fulfilled') return
        const quote = order.quote as Quote
        const pi =
            typeof session.payment_intent === 'string'
                ? session.payment_intent
                : (session.payment_intent?.id ?? null)
        if (
            session.client_reference_id !== id ||
            session.metadata?.account_id !== order.account_id ||
            (order.stripe_session_id !== null && session.id !== order.stripe_session_id) ||
            session.currency !== 'usd' ||
            session.amount_total !== quote.total_cents
        ) {
            await tx
                .update(s.checkout_order)
                .set({ needs_attention: true })
                .where(eq(s.checkout_order.checkout_order_id, id))
            return
        }
        const paid =
            session.status === 'complete' &&
            (quote.total_cents === 0
                ? session.payment_status === 'paid' ||
                  session.payment_status === 'no_payment_required'
                : session.payment_status === 'paid' && pi !== null)
        if (!paid) {
            if (failed || session.status === 'expired')
                await tx
                    .update(s.checkout_order)
                    .set({ status: 'closed', stripe_session_id: session.id })
                    .where(eq(s.checkout_order.checkout_order_id, id))
            return
        }
        await tx
            .select()
            .from(s.account)
            .where(eq(s.account.account_id, order.account_id))
            .for('update')
        await tx
            .select()
            .from(s.purchase_type)
            .where(
                inArray(
                    s.purchase_type.purchase_type_id,
                    quote.units.map((u) => u.purchase_type_id),
                ),
            )
            .orderBy(s.purchase_type.purchase_type_id)
            .for('update')
        if (order.discount_code_id)
            await tx
                .select()
                .from(s.discount_code)
                .where(eq(s.discount_code.discount_code_id, order.discount_code_id))
                .for('update')
        const ids = new Map(
            quote.units.filter((u) => !u.parent_key).map((u) => [u.key, randomUUID()]),
        )
        for (const u of quote.units)
            await tx.insert(s.purchase).values({
                purchase_id: ids.get(u.key) ?? randomUUID(),
                purchase_type_id: u.purchase_type_id,
                owned_by_account_id: order.account_id,
                parent_purchase_id: u.parent_key
                    ? (order.target_ticket_id ?? ids.get(u.parent_key))
                    : null,
                checkout_order_id: id,
                gross_price_cents: u.gross_cents,
                discount_cents: u.discount_cents,
                product_name_snapshot: u.name,
                details_snapshot: u.details,
                additional_info_snapshot: u.additional_info,
                stripe_payment_intent: pi,
                is_test_purchase: usingStripeTestKey,
            })
        await tx
            .update(s.checkout_order)
            .set({
                status: 'fulfilled',
                stripe_session_id: session.id,
                payment_intent: pi,
                stripe_event_id: eventId,
                fulfilled_at: new Date().toISOString(),
            })
            .where(eq(s.checkout_order.checkout_order_id, id))
        const over = await tx.execute(
            sql`select 1 from purchase_type pt join purchase p using (purchase_type_id) where p.checkout_order_id = ${id} and (pt.max_available < (select count(*) from purchase all_p where all_p.purchase_type_id = pt.purchase_type_id) or pt.max_per_account < (select count(*) from purchase own_p where own_p.purchase_type_id = pt.purchase_type_id and own_p.owned_by_account_id = ${order.account_id})) limit 1`,
        )
        const codeOver = order.discount_code_id
            ? (
                  await tx.execute(
                      sql`select 1 from discount_code d where d.discount_code_id = ${order.discount_code_id} and d.max_uses < (select coalesce(sum(discounted_ticket_count),0) from checkout_order o where o.discount_code_id = d.discount_code_id and o.status = 'fulfilled')`,
                  )
              ).rows.length > 0
            : false
        if (over.rows.length || codeOver) {
            console.error('Paid order exceeded configured limits', id)
            await tx
                .update(s.checkout_order)
                .set({ needs_attention: true })
                .where(eq(s.checkout_order.checkout_order_id, id))
        }
        return {
            order,
            quote,
            account: (
                await tx.select().from(s.account).where(eq(s.account.account_id, order.account_id))
            )[0],
        }
    })
    if (receipt) {
        try {
            invariant(receipt.account)
            await sendMail(orderReceiptEmail(receipt.account, receipt.quote))
        } catch (error) {
            // The purchase is already recorded; a lost receipt is a support task, not a failed order.
            console.error('Receipt failed', id, error)
        }
    }
}

export async function checkoutStatus(accountId: string, input: unknown): Promise<OrderStatus> {
    const parsed = z
        .strictObject({ order_id: z.uuid(), cancel: z.literal(true).optional() })
        .safeParse(input)
    invariant(parsed.success)
    const cancel = parsed.data.cancel === true
    const initial = (
        await db
            .select()
            .from(s.checkout_order)
            .where(
                and(
                    eq(s.checkout_order.checkout_order_id, parsed.data.order_id),
                    eq(s.checkout_order.account_id, accountId),
                ),
            )
    )[0]
    if (!initial) throw new CartError('invalid_request', undefined, 404)
    let order: Order = initial
    if (order.status === 'pending' && !order.needs_attention) {
        try {
            if (!order.stripe_session_id) {
                await startSession(order)
                order =
                    (
                        await db
                            .select()
                            .from(s.checkout_order)
                            .where(eq(s.checkout_order.checkout_order_id, order.checkout_order_id))
                    )[0] ?? order
            }
            if (order.stripe_session_id) {
                let session = await stripe.checkout.sessions.retrieve(order.stripe_session_id)
                if (cancel && session.status === 'open') {
                    try {
                        session = await stripe.checkout.sessions.expire(session.id)
                    } catch {
                        session = await stripe.checkout.sessions.retrieve(session.id)
                    }
                }
                await reconcileSession(session)
            }
        } catch (error) {
            console.error('Checkout reconciliation deferred', order.checkout_order_id, error)
        }
    }
    return statusOf(
        (
            await db
                .select()
                .from(s.checkout_order)
                .where(eq(s.checkout_order.checkout_order_id, order.checkout_order_id))
        )[0] ?? order,
    )
}

export async function recordStripeWebhook(rawBody: string, signature: string | null) {
    let event: Stripe.Event
    try {
        event = stripe.webhooks.constructEvent(rawBody, signature ?? '', env.STRIPE_WEBHOOK_SECRET)
    } catch {
        return 400 as const
    }
    if (
        [
            'checkout.session.completed',
            'checkout.session.async_payment_succeeded',
            'checkout.session.async_payment_failed',
            'checkout.session.expired',
        ].includes(event.type)
    )
        await reconcileSession(
            event.data.object as Stripe.Checkout.Session,
            event.id,
            event.type === 'checkout.session.async_payment_failed',
        )
    return 200 as const
}
