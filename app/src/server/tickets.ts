import { and, eq, gte } from 'drizzle-orm'
import { z } from 'zod'
import { db, type Tx } from '@/db'
import * as s from '@/db/schema'
import { badgeSchema, CartError, invariant } from '@/lib/cart'

const today = () => new Date().toISOString().slice(0, 10)

async function editableTicket(tx: Tx, accountId: string, ticketId: string) {
    const ticket = (
        await tx
            .select()
            .from(s.purchase)
            .where(
                and(
                    eq(s.purchase.purchase_id, ticketId),
                    eq(s.purchase.owned_by_account_id, accountId),
                ),
            )
            .for('update')
    )[0]
    if (!ticket) throw new CartError('invalid_request', undefined, 404)
    invariant(!ticket.parent_purchase_id)
    const product = (
        await tx
            .select()
            .from(s.purchase_type)
            .where(eq(s.purchase_type.purchase_type_id, ticket.purchase_type_id))
    )[0]
    invariant(product?.is_attendance_ticket)
    const festival = (
        await tx.select().from(s.festival).where(eq(s.festival.festival_id, product.festival_id))
    )[0]
    invariant(festival && festival.end_date >= today())
    return { ticket, product }
}

export async function saveTicketBadge(accountId: string, input: unknown) {
    const body = z.strictObject({ ticket_id: z.uuid(), badge: badgeSchema }).safeParse(input)
    invariant(body.success)
    await db.transaction(async (tx) => {
        const { ticket } = await editableTicket(tx, accountId, body.data.ticket_id)
        await tx
            .insert(s.ticket_badge)
            .values({ ticket_id: ticket.purchase_id, ...body.data.badge })
            .onConflictDoUpdate({ target: s.ticket_badge.ticket_id, set: body.data.badge })
    })
    return null
}

export async function ownedTickets(accountId: string) {
    const [rows, badges] = await Promise.all([
        db
            .select({ purchase: s.purchase, product: s.purchase_type, festival: s.festival })
            .from(s.purchase)
            .innerJoin(
                s.purchase_type,
                eq(s.purchase.purchase_type_id, s.purchase_type.purchase_type_id),
            )
            .innerJoin(s.festival, eq(s.festival.festival_id, s.purchase_type.festival_id))
            .where(
                and(
                    eq(s.purchase.owned_by_account_id, accountId),
                    gte(s.festival.end_date, today()),
                ),
            ),
        db
            .select({ badge: s.ticket_badge })
            .from(s.ticket_badge)
            .innerJoin(s.purchase, eq(s.ticket_badge.ticket_id, s.purchase.purchase_id))
            .where(eq(s.purchase.owned_by_account_id, accountId)),
    ])
    return rows.map(({ purchase, product, festival }) => ({
        ...purchase,
        festival_id: festival.festival_id,
        festival_name: festival.festival_name,
        end_date: festival.end_date,
        is_attendance_ticket: product.is_attendance_ticket,
        name: purchase.product_name_snapshot ?? product.description,
        details: purchase.checkout_order_id ? purchase.details_snapshot : product.details,
        additional_info: purchase.checkout_order_id
            ? purchase.additional_info_snapshot
            : product.additional_info,
        badge: badges.find((b) => b.badge.ticket_id === purchase.purchase_id)?.badge ?? null,
    }))
}
export type OwnedTicket = Awaited<ReturnType<typeof ownedTickets>>[number]

export async function saveProfile(accountId: string, input: unknown) {
    const body = z
        .object({
            name: z.string().trim().min(1),
            age_range: z.string().min(1),
            phone_number: z
                .string()
                .regex(/^ ?\(? ?[0-9]{3} ?\)? ?[0-9]{3} ?-? ?[0-9]{4} ?$/)
                .or(z.literal(''))
                .nullable(),
            twitter_handle: z
                .string()
                .refine((v) => !v.startsWith('@'))
                .nullable(),
            discord_handle: z.string().nullable(),
        })
        .safeParse(input)
    invariant(body.success)
    const age = (
        await db.select().from(s.age_range).where(eq(s.age_range.age_range, body.data.age_range))
    )[0]
    invariant(age)
    await db.transaction(async (tx) => {
        await tx.select().from(s.account).where(eq(s.account.account_id, accountId)).for('update')
        const existing = (
            await tx
                .select()
                .from(s.attendee)
                .where(
                    and(
                        eq(s.attendee.associated_account_id, accountId),
                        eq(s.attendee.is_primary_for_account, true),
                    ),
                )
        )[0]
        if (existing)
            await tx
                .update(s.attendee)
                .set(body.data)
                .where(eq(s.attendee.attendee_id, existing.attendee_id))
        else
            await tx.insert(s.attendee).values({
                ...body.data,
                associated_account_id: accountId,
                is_primary_for_account: true,
            })
    })
    return null
}
