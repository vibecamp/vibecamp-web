import bcrypt from 'bcryptjs'
import { describe, expect, it } from 'vitest'

describe('password hashing', () => {
    it('verifies a hash produced by the old Deno bcrypt library', async () => {
        const { authenticatePassword } = await import('@/server/auth')
        expect(
            await authenticatePassword(
                {
                    password_salt: 'b3a4b3c8-6f7e-4d9a-9c1d-2b4f5e6a7b8c',
                    password_hash: '$2a$10$38FZl6ioT9LaC1Y0e3CCOOuhWcZhkDmltOwfFs/57AcIKFebOkwgy',
                },
                'password',
            ),
        ).toBe(true)
    })

    it('produces $2a$ cost-10 hashes the old library can verify, and rejects wrong passwords', async () => {
        const { authenticatePassword, hashAndSaltPassword } = await import('@/server/auth')
        const { password_hash, password_salt } = await hashAndSaltPassword('hunter22')
        expect(password_hash.startsWith('$2a$10$')).toBe(true)
        expect(password_salt).toMatch(/^[0-9a-f-]{36}$/)
        expect(await bcrypt.compare(`hunter22${password_salt}`, password_hash)).toBe(true)
        expect(await authenticatePassword({ password_hash, password_salt }, 'hunter23')).toBe(false)
        expect(await authenticatePassword({ password_hash: null, password_salt: null }, 'x')).toBe(
            false,
        )
    })
})

describe('JWT', () => {
    it('round-trips and carries { iss, exp, account_id }', async () => {
        const { createAccountJwt, verifyAccountJwt } = await import('@/server/auth')
        const token = await createAccountJwt({ account_id: '53705698-51d1-435a-afc3-a26ef1ec3181' })
        const payload = await verifyAccountJwt(token)
        expect(payload?.account_id).toBe('53705698-51d1-435a-afc3-a26ef1ec3181')
        expect(payload?.iss).toBe('vibecamp')
        const thirtyDays = 30 * 24 * 60 * 60
        expect(
            Math.abs((payload?.exp ?? 0) - (Math.round(Date.now() / 1000) + thirtyDays)),
        ).toBeLessThan(5)
    })

    it('verifies a token minted by the old djwt-based back-end (same secret, HS256)', async () => {
        const { verifyAccountJwt } = await import('@/server/auth')

        const old =
            'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJ2aWJlY2FtcCIsImV4cCI6NDEwMjQ0NDgwMCwiYWNjb3VudF9pZCI6IjUzNzA1Njk4LTUxZDEtNDM1YS1hZmMzLWEyNmVmMWVjMzE4MSJ9.xc5BNaJtQjfql1gj-4NDnk4t94NzOzbVA9z8g8zxP6U'
        const payload = await verifyAccountJwt(old)
        expect(payload?.account_id).toBe('53705698-51d1-435a-afc3-a26ef1ec3181')
        expect(payload?.exp).toBe(4102444800)
    })

    it('rejects a bad signature and an expired token', async () => {
        const { createAccountJwt, verifyAccountJwt } = await import('@/server/auth')
        const token = await createAccountJwt({ account_id: '53705698-51d1-435a-afc3-a26ef1ec3181' })
        expect(await verifyAccountJwt(`${token}x`)).toBeUndefined()
        expect(await verifyAccountJwt('not.a.jwt')).toBeUndefined()
    })
})
