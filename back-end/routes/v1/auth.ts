import { User, VibeJWTPayload } from "https://raw.githubusercontent.com/vibecamp/vibecamp-web/main/common/data.ts";
import { Router, Status } from "../../deps/oak.ts";
import { AnyRouterContext, AnyRouterMiddleware, defineRoute } from "./_common.ts";
import { create, getNumericDate, Payload, verify } from '../../deps/djwt.ts'
import { authenticateByEmail } from "../../db-access/users.ts";

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

    defineRoute<{ success: boolean, jwt: string | null }>(router, {
        endpoint: '/login',
        method: 'post',
        requiredPermissions: PUBLIC_PERMISSIONS,
        handler: async ctx => {
            const { email, password } = await ctx.request.body({ type: 'json' }).value as { email?: unknown, password?: unknown }

            if (typeof email === 'string' && typeof password === 'string') {
                const user = await authenticateByEmail({ email, password })

                if (user != null) {
                    const { is_content_admin, is_account_admin } = user
                    const payload: Payload & VibeJWTPayload = {
                        iss: "vibecamp",
                        exp: getNumericDate(Date.now() + 30 * 60 * 60 * 1_000),
                        is_content_admin,
                        is_account_admin
                    }
                    const jwt = await create(header, payload, JWT_SECRET_KEY)
                    return [{ success: true, jwt }, Status.OK]
                }
            }

            return [{ success: false, jwt: null }, Status.Unauthorized]
        }
    })
}

export async function getPermissions(ctx: AnyRouterContext): Promise<Permissions> {
    const header = ctx.request.headers.get('Authorization');
    const bearerPrefix = 'Bearer '
    if (header != null && header.startsWith(bearerPrefix)) {
        const token = header.substring(bearerPrefix.length)

        try {
            const result = await verify(token, JWT_SECRET_KEY);
            const { is_content_admin, is_account_admin } = result as Payload & VibeJWTPayload
            return { is_content_admin, is_account_admin }
        } catch {
        }
    }

    return PUBLIC_PERMISSIONS
}

export const requirePermissions = (required: Permissions): AnyRouterMiddleware => async (ctx: AnyRouterContext, next) => {
    const { is_content_admin, is_account_admin } = await getPermissions(ctx)

    ctx.assert(!required.is_content_admin || is_content_admin, Status.Unauthorized)
    ctx.assert(!required.is_account_admin || is_account_admin, Status.Unauthorized)

    await next()
}

export type Permissions = Pick<User, 'is_content_admin' | 'is_account_admin'>

export const PUBLIC_PERMISSIONS: Permissions = { is_content_admin: false, is_account_admin: false }