import { and, eq, gte, isNull, sql } from 'drizzle-orm'
import { z } from 'zod'
import { db } from '@/db'
import * as s from '@/db/schema'
import { env } from '@/env'
import { invariant } from '@/lib/cart'

const today = () => new Date().toISOString().slice(0, 10)

const secretWords = env.TICKET_SECRET?.split(/\s+/).filter(Boolean) ?? []

function ticketSecret(index: number | null) {
    if (index === null) return null
    const word = secretWords[index]
    return word === undefined ? null : { position: index, word }
}

async function assignTicketSecrets(accountId: string) {
    if (secretWords.length === 0) return
    const pending = await db
        .select({ purchase_id: s.purchase.purchase_id, festival_id: s.festival.festival_id })
        .from(s.purchase)
        .innerJoin(
            s.purchase_type,
            eq(s.purchase.purchase_type_id, s.purchase_type.purchase_type_id),
        )
        .innerJoin(s.festival, eq(s.festival.festival_id, s.purchase_type.festival_id))
        .where(
            and(
                eq(s.purchase.owned_by_account_id, accountId),
                eq(s.purchase_type.is_attendance_ticket, true),
                isNull(s.purchase.secret_index),
                gte(s.festival.end_date, today()),
            ),
        )
    for (const ticket of pending) {
        await db.transaction(async (tx) => {
            await tx.execute(sql`SELECT pg_advisory_xact_lock(hashtext(${ticket.festival_id}))`)
            await tx.execute(sql`
                UPDATE purchase SET secret_index = (
                    SELECT n FROM generate_series(0, ${secretWords.length - 1}) AS n
                    LEFT JOIN (
                        SELECT p.secret_index, count(*) AS used
                        FROM purchase p JOIN purchase_type t USING (purchase_type_id)
                        WHERE t.festival_id = ${ticket.festival_id} AND p.secret_index IS NOT NULL
                        GROUP BY p.secret_index
                    ) taken ON taken.secret_index = n
                    ORDER BY coalesce(taken.used, 0), random()
                    LIMIT 1
                )
                WHERE purchase_id = ${ticket.purchase_id} AND secret_index IS NULL`)
        })
    }
}

export async function ownedTickets(accountId: string) {
    await assignTicketSecrets(accountId)
    const rows = await db
        .select({ purchase: s.purchase, product: s.purchase_type, festival: s.festival })
        .from(s.purchase)
        .innerJoin(
            s.purchase_type,
            eq(s.purchase.purchase_type_id, s.purchase_type.purchase_type_id),
        )
        .innerJoin(s.festival, eq(s.festival.festival_id, s.purchase_type.festival_id))
        .where(
            and(eq(s.purchase.owned_by_account_id, accountId), gte(s.festival.end_date, today())),
        )
    return rows.map(({ purchase: { secret_index, ...purchase }, product, festival }) => ({
        ...purchase,
        festival_id: festival.festival_id,
        festival_name: festival.festival_name,
        start_date: festival.start_date,
        end_date: festival.end_date,
        is_attendance_ticket: product.is_attendance_ticket,
        name: purchase.product_name_snapshot ?? product.description,
        details: purchase.checkout_order_id ? purchase.details_snapshot : product.details,
        additional_info: purchase.checkout_order_id
            ? purchase.additional_info_snapshot
            : product.additional_info,
        secret: product.is_attendance_ticket ? ticketSecret(secret_index) : null,
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
