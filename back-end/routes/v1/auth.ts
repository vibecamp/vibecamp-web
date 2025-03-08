import { VibeJWTPayload } from '../../types/misc.ts'
import { Router, Status } from 'oak'
import { AnyRouterContext, defineRoute, rateLimited } from './_common.ts'
import { create, getNumericDate, verify } from 'djwts'
import { compare, hash } from 'bcrypt'
import { Tables } from '../../types/db-types.ts'
import { withDBConnection } from '../../utils/db.ts'
import {
  getEmailValidationError,
  getPasswordValidationError,
} from '../../utils/validation.ts'

const JWT_SECRET_KEY = await crypto.subtle.importKey(
  'raw',
  new TextEncoder().encode('JWT_SECRET_KEY'),
  { name: 'HMAC', hash: 'SHA-256' },
  true,
  ['sign', 'verify'],
)

const header = {
  alg: 'HS256',
  typ: 'JWT',
} as const

export default function register(router: Router) {
  defineRoute(router, {
    endpoint: '/login',
    method: 'post',
    handler: rateLimited(
      500,
      async ({ body: { email_address: raw_email_address, password } }) => {
        const email_address = raw_email_address.toLowerCase()

        // get account from DB
        const account = (await withDBConnection(async (db) =>
          db.queryObject<
            Tables['account']
          >`SELECT * FROM account WHERE email_address = ${email_address}`
        )).rows[0]
        if (account == null) {
          return [{ jwt: null }, Status.Unauthorized]
        }

        // verify password
        if (!await authenticatePassword(account, password)) {
          return [{ jwt: null }, Status.Unauthorized]
        }

        // construct the JWT token and respond with it
        return [{ jwt: await createAccountJwt(account) }, Status.OK]
      },
    ),
  })

  defineRoute(router, {
    endpoint: '/signup',
    method: 'post',
    handler: rateLimited(
      500,
      async ({ body: { email_address: raw_email_address, password } }) => {
        const email_address = raw_email_address.toLowerCase()

        // extract email/password from request
        if (
          getEmailValidationError(email_address) ||
          getPasswordValidationError(password)
        ) {
          return [{ jwt: null }, Status.BadRequest]
        }

        // create account in DB
        const { password_hash, password_salt } = await hashAndSaltPassword(
          password,
        )

        const account = await withDBConnection(async (db) => {
          const existingAccount = (await db.queryTable('account', {
            where: ['email_address', '=', email_address],
          }))[0]

          if (
            existingAccount != null && existingAccount.password_hash == null &&
            existingAccount.password_salt == null
          ) {
            return (await db.updateTable('account', {
              email_address,
              password_hash,
              password_salt,
            }, [
              ['account_id', '=', existingAccount.account_id],
            ]))[0]
          } else {
            return await db.insertTable('account', {
              email_address,
              password_hash,
              password_salt,
            })
          }
        })

        if (account == null) {
          return [{ jwt: null }, Status.InternalServerError]
        }

        // construct the JWT token and respond with it
        return [{ jwt: await createAccountJwt(account) }, Status.OK]
      },
    ),
  })
}

const ONE_MINUTE_S = 60
const ONE_HOUR_S = 60 * ONE_MINUTE_S
const ONE_DAY_S = 24 * ONE_HOUR_S

export async function createAccountJwt(
  account: Tables['account'],
): Promise<string> {
  const payload: VibeJWTPayload = {
    iss: 'vibecamp',
    exp: getNumericDate(new Date()) + 30 * ONE_DAY_S,
    account_id: account.account_id,
  }

  return await create(header, payload, JWT_SECRET_KEY)
}

export async function getJwtPayload(
  ctx: AnyRouterContext,
): Promise<VibeJWTPayload | undefined> {
  const header = ctx.request.headers.get('Authorization')
  const bearerPrefix = 'Bearer '
  if (header != null && header.startsWith(bearerPrefix)) {
    const token = header.substring(bearerPrefix.length)

    try {
      const result = await verify(token, JWT_SECRET_KEY)
      return result as VibeJWTPayload
    } catch {
    }
  }
}

async function authenticatePassword(
  account: Tables['account'],
  password: string,
): Promise<boolean> {
  const saltedPassword = password + account.password_salt
  const passwordMatches = await compare(
    saltedPassword,
    account.password_hash ?? '',
  )
  return passwordMatches
}

export async function hashAndSaltPassword(
  password: string,
): Promise<{ password_hash: string; password_salt: string }> {
  const password_salt = crypto.randomUUID()
  const saltedPassword = password + password_salt
  const password_hash = await hash(saltedPassword)
  return { password_hash, password_salt }
}
