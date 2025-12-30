import { load as loadDotenv } from 'std/dotenv/mod.ts'

const readPermission = await Deno.permissions.query({ name: 'read' })

// Load .env.public first (lower priority)
const publicDotEnv =
  readPermission.state === 'granted'
    ? await loadDotenv({ envPath: '.env.public', examplePath: null })
    : {}

// Load .env second (higher priority)
const privateDotEnv =
  readPermission.state === 'granted'
    ? await loadDotenv({ envPath: '.env', examplePath: null })
    : {}


// System env vars take highest priority, then file-based vars
const getVal = (key: string) =>
  Deno.env.get(key) || privateDotEnv[key] || publicDotEnv[key]

function assertEnv(key: string): string {
  const val = getVal(key)

  if (!val) {
    throw Error(`Expected env variable ${key} wasn't found`)
  }

  return val
}

function tryEnv(key: string): string | undefined {
  const val = getVal(key)

  if (!val == null) {
    console.warn(`Env variable ${key} is unset. Some features may not work!`)
  }

  return val
}

export default {
  DB_URL: assertEnv('DB_URL'),
  STRIPE_SECRET_KEY: assertEnv('STRIPE_SECRET_KEY'),
  STRIPE_SIGNING_SECRET: assertEnv('STRIPE_SIGNING_SECRET'),
  MAILGUN_API_KEY: tryEnv('MAILGUN_API_KEY'),
  DB_CONNECTION_POOL_SIZE: Number(assertEnv('DB_CONNECTION_POOL_SIZE')),
  FRONT_END_BASE_URL: assertEnv('FRONT_END_BASE_URL'),
  SELF_LATHING_SECRET_KEY: tryEnv('SELF_LATHING_SECRET_KEY'),
  JWT_SECRET: assertEnv('JWT_SECRET'),
}
