import { VibeJWTPayload } from "https://raw.githubusercontent.com/vibecamp/vibecamp-web/main/common/data.ts";
import { Router, Status } from "oak";
import { AnyRouterContext, defineRoute } from "./_common.ts";
import { create, getNumericDate, verify } from 'djwts'
import { compare, hash } from 'bcrypt'
import { Account } from "../../db.d.ts";
import { db } from "../../db.ts";

const encoder = new TextEncoder()
const JWT_SECRET_KEY = await crypto.subtle.importKey(
    'raw',
    encoder.encode("JWT_SECRET_KEY"),
    { name: 'HMAC', hash: 'SHA-256' },
    true,
    ['sign', 'verify']
)

const header = {
    alg: "HS256",
    typ: "JWT",
} as const

export default function register(router: Router) {

    defineRoute<{ jwt: string | null }>(router, {
        endpoint: '/login',
        method: 'post',
        handler: async ctx => {

            // extract email/password from request
            const { email_address, password } = await ctx.request.body({ type: 'json' }).value as { email_address?: unknown, password?: unknown }
            if (typeof email_address !== 'string' || typeof password !== 'string') {
                return [{ jwt: null }, Status.Unauthorized]
            }

            // get account from DB
            const account = await db.selectFrom('account').where('email_address', '=', email_address).selectAll().executeTakeFirst()
            if (account == null) {
                return [{ jwt: null }, Status.Unauthorized]
            }

            // verify password
            if (!authenticatePassword(account, password)) {
                return [{ jwt: null }, Status.Unauthorized]
            }

            // construct the JWT token and respond with it
            return [{ jwt: await createAccountJwt(account) }, Status.OK]
        }
    })

    defineRoute<{ jwt: string | null }>(router, {
        endpoint: '/signup',
        method: 'post',
        handler: async ctx => {

            // extract email/password from request
            const { email_address, password } = await ctx.request.body({ type: 'json' }).value as { email_address?: unknown, password?: unknown }
            if (typeof email_address !== 'string' || typeof password !== 'string') {
                return [{ jwt: null }, Status.Unauthorized]
            }

            // create account in DB
            const { password_hash, password_salt } = await hashAndSaltPassword(password)

            const account = await db
                .insertInto('account')
                .values({
                    email_address,
                    password_hash,
                    password_salt,
                })
                .returningAll()
                .executeTakeFirstOrThrow()

            // construct the JWT token and respond with it
            return [{ jwt: await createAccountJwt(account) }, Status.OK]
        }
    })
}

async function createAccountJwt(account: Account): Promise<string> {
    const payload: VibeJWTPayload = {
        iss: "vibecamp",
        exp: getNumericDate(Date.now() + 30 * 60 * 60 * 1_000),
        account_id: account.account_id
    }

    return await create(header, payload, JWT_SECRET_KEY)
}

export async function getJwtPayload(ctx: AnyRouterContext): Promise<VibeJWTPayload | undefined> {
    const header = ctx.request.headers.get('Authorization');
    const bearerPrefix = 'Bearer '
    if (header != null && header.startsWith(bearerPrefix)) {
        const token = header.substring(bearerPrefix.length)

        try {
            const result = await verify(token, JWT_SECRET_KEY);
            return result as VibeJWTPayload
            // deno-lint-ignore no-empty
        } catch {
        }
    }
}

async function authenticatePassword(account: Account, password: string): Promise<boolean> {
    const saltedPassword = password + account.password_salt
    const passwordMatches = await compare(saltedPassword, account.password_hash)
    return passwordMatches
}

async function hashAndSaltPassword(password: string): Promise<{ password_hash: string, password_salt: string }> {
    const password_salt = crypto.randomUUID()
    const saltedPassword = password + password_salt
    const password_hash = await hash(saltedPassword)
    return { password_hash, password_salt }
}
