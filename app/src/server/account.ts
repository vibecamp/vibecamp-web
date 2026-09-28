import { and, eq } from 'drizzle-orm'
import type { FullAccountInfo } from '@/contract/misc'
import type { Routes } from '@/contract/route-types'
import { db, transaction } from '@/db'
import * as s from '@/db/schema'
import type { Tables } from '@/db/types'
import type { RouteResult, Status } from '@/lib/define-route'
import { getEmailValidationError, getPasswordValidationError } from '@/lib/validation'
import { authenticatePassword, createAccountJwt, hashAndSaltPassword } from './auth'
import { passwordResetEmail, sendMail } from './mail'
import { ownedTickets } from './tickets'

type AccountId = Tables['account']['account_id']

const ONE_HOUR_MS = 60 * 60 * 1000

export async function login(
    body: Routes['/login']['body'],
): Promise<RouteResult<Routes['/login']['response']>> {
    const email_address = body.email_address.toLowerCase()
    const account = (
        await db.select().from(s.account).where(eq(s.account.email_address, email_address))
    )[0]
    if (account == null || !(await authenticatePassword(account, body.password))) {
        return [{ jwt: null }, 401]
    }
    return [{ jwt: await createAccountJwt(account) }, 200]
}

export async function signup(
    body: Routes['/signup']['body'],
): Promise<RouteResult<Routes['/signup']['response']>> {
    const email_address = body.email_address.toLowerCase()
    const { password } = body

    if (getEmailValidationError(email_address) || getPasswordValidationError(password)) {
        return [{ jwt: null }, 400]
    }

    const { password_hash, password_salt } = await hashAndSaltPassword(password)

    const account = await transaction(async (tx) => {
        const existing = (
            await tx.select().from(s.account).where(eq(s.account.email_address, email_address))
        )[0]

        if (existing != null && existing.password_hash == null && existing.password_salt == null) {
            return (
                await tx
                    .update(s.account)
                    .set({ email_address, password_hash, password_salt })
                    .where(eq(s.account.account_id, existing.account_id))
                    .returning()
            )[0]
        }
        if (existing != null) {
            return undefined
        }
        return (
            await tx
                .insert(s.account)
                .values({ email_address, password_hash, password_salt })
                .returning()
        )[0]
    })

    if (account == null) {
        return [{ jwt: null }, 400]
    }
    return [{ jwt: await createAccountJwt(account) }, 200]
}

export async function getFullAccountInfo(
    account_id: AccountId,
): Promise<RouteResult<FullAccountInfo>> {
    const [accounts, attendees, owned_tickets] = await Promise.all([
        db.select().from(s.account).where(eq(s.account.account_id, account_id)),
        db
            .select({
                name: s.attendee.name,
                phone_number: s.attendee.phone_number,
                twitter_handle: s.attendee.twitter_handle,
                discord_handle: s.attendee.discord_handle,
                age_range: s.attendee.age_range,
            })
            .from(s.attendee)
            .where(
                and(
                    eq(s.attendee.associated_account_id, account_id),
                    eq(s.attendee.is_primary_for_account, true),
                ),
            ),
        ownedTickets(account_id),
    ])

    const account = accounts[0]
    if (account == null) {
        return [null, 404]
    }

    return [
        {
            account_id: account.account_id,
            email_address: account.email_address,
            owned_tickets,
            primary_attendee: attendees[0] ?? null,
        },
        200,
    ]
}

export async function updateEmail(
    account_id: AccountId,
    raw_email_address: string,
): Promise<Status> {
    const email_address = raw_email_address.toLowerCase()
    if (getEmailValidationError(email_address)) {
        return 400
    }
    await db.update(s.account).set({ email_address }).where(eq(s.account.account_id, account_id))
    return 200
}

export async function updatePassword(account_id: AccountId, password: string): Promise<Status> {
    if (getPasswordValidationError(password)) {
        return 400
    }
    const { password_hash, password_salt } = await hashAndSaltPassword(password)
    await db
        .update(s.account)
        .set({ password_hash, password_salt })
        .where(eq(s.account.account_id, account_id))
    return 200
}

export async function sendPasswordResetEmail(raw_email_address: string): Promise<Status> {
    const email_address = raw_email_address.toLowerCase()
    const account = (
        await db.select().from(s.account).where(eq(s.account.email_address, email_address))
    )[0]
    if (account == null) {
        return 400
    }
    const secret = crypto.randomUUID()
    await db
        .insert(s.account_password_reset_secret)
        .values({ account_id: account.account_id, secret })
    await sendMail(passwordResetEmail(account, secret))
    return 200
}

export async function resetPassword(
    body: Routes['/account/reset-password']['body'],
): Promise<RouteResult<Routes['/account/reset-password']['response']>> {
    const { password, secret } = body
    if (getPasswordValidationError(password)) {
        return [{ jwt: null }, 400]
    }

    const account = await transaction(async (tx) => {
        const row = (
            await tx
                .select()
                .from(s.account_password_reset_secret)
                .where(eq(s.account_password_reset_secret.secret, secret))
        )[0]
        const expired = row != null && Date.now() - new Date(row.created_at).valueOf() > ONE_HOUR_MS
        if (row == null || row.used_at != null || expired) {
            return undefined
        }
        await tx
            .update(s.account_password_reset_secret)
            .set({ used_at: new Date().toISOString() })
            .where(
                eq(
                    s.account_password_reset_secret.account_password_reset_secret_id,
                    row.account_password_reset_secret_id,
                ),
            )

        const { password_hash, password_salt } = await hashAndSaltPassword(password)
        return (
            await tx
                .update(s.account)
                .set({ password_hash, password_salt })
                .where(eq(s.account.account_id, row.account_id))
                .returning()
        )[0]
    })

    if (account == null) {
        return [{ jwt: null }, 400]
    }
    return [{ jwt: await createAccountJwt(account) }, 200]
}
