import bcrypt from 'bcryptjs'
import { jwtVerify, SignJWT } from 'jose'
import type { NextRequest } from 'next/server'
import type { VibeJWTPayload } from '@/contract/misc'
import type { Tables } from '@/db/types'
import { env } from '@/env'

const key = new TextEncoder().encode(env.JWT_SECRET)
const ONE_DAY_S = 24 * 60 * 60

export async function createAccountJwt(
    account: Pick<Tables['account'], 'account_id'>,
): Promise<string> {
    const exp = Math.round(Date.now() / 1000) + 30 * ONE_DAY_S
    return new SignJWT({ account_id: account.account_id })
        .setProtectedHeader({ alg: 'HS256', typ: 'JWT' })
        .setIssuer('vibecamp')
        .setExpirationTime(exp)
        .sign(key)
}

export async function verifyAccountJwt(token: string): Promise<VibeJWTPayload | undefined> {
    try {
        const { payload } = await jwtVerify(token, key, { algorithms: ['HS256'] })
        if (typeof payload.account_id !== 'string') {
            return undefined
        }
        return payload as VibeJWTPayload
    } catch {
        return undefined
    }
}

export async function getJwtPayload(req: NextRequest): Promise<VibeJWTPayload | undefined> {
    const header = req.headers.get('authorization')
    const prefix = 'Bearer '
    if (header?.startsWith(prefix)) {
        return verifyAccountJwt(header.substring(prefix.length))
    }
    return undefined
}

export async function authenticatePassword(
    account: Pick<Tables['account'], 'password_hash' | 'password_salt'>,
    password: string,
): Promise<boolean> {
    const saltedPassword = password + account.password_salt
    return bcrypt.compare(saltedPassword, account.password_hash ?? '')
}

export async function hashAndSaltPassword(
    password: string,
): Promise<{ password_hash: string; password_salt: string }> {
    const password_salt = crypto.randomUUID()
    const saltedPassword = password + password_salt

    const salt = (await bcrypt.genSalt(10)).replace(/^\$2b\$/, '$2a$')
    const password_hash = await bcrypt.hash(saltedPassword, salt)
    return { password_hash, password_salt }
}
