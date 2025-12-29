import { load as loadDotenv } from 'std/dotenv/mod.ts'

const readPermission = await Deno.permissions.query({ name: 'read' })
const env = readPermission.state === 'granted' ? await loadDotenv() : {}

function assertEnv(key: string): string {
  const val = env[key] ?? Deno.env.get(key)

  if (val == null || val === '') {
    throw Error(`Expected env variable ${key} wasn't found`)
  }

  return val
}

export default {
  DB_URL: assertEnv('DB_URL'),
  STRIPE_SECRET_KEY: assertEnv('STRIPE_SECRET_KEY'),
  STRIPE_SIGNING_SECRET: assertEnv('STRIPE_SIGNING_SECRET'),
  MAILGUN_API_KEY: assertEnv('MAILGUN_API_KEY'),
  DB_CONNECTION_POOL_SIZE: Number(assertEnv('DB_CONNECTION_POOL_SIZE')),
  FRONT_END_BASE_URL: assertEnv('FRONT_END_BASE_URL'),
  SELF_LATHING_SECRET_KEY: assertEnv('SELF_LATHING_SECRET_KEY'),
  JWT_SECRET: assertEnv('JWT_SECRET'),
}
