import { load as loadDotenv } from 'std/dotenv/mod.ts'

const readPermission = await Deno.permissions.query({ name: 'read' })
const env = (
  readPermission.state === 'granted'
    ? await loadDotenv()
    : {}
)

function assertEnv(key: string): string {
  const val = env[key] ?? Deno.env.get(key)

  if (val == null || val === '') {
    throw Error(`Expected env variable ${key} wasn't found`)
  }

  return val
}

export default {
  DB_URL: assertEnv('DB_URL'),
  STRIPE_API_KEY: assertEnv('STRIPE_API_KEY'),
}
