
import { load as loadDotenv } from 'std/dotenv/mod.ts'

const env = await loadDotenv();

function assertEnv(key: string): string {
    const val = env[key]

    if (val == null || val === '') {
        throw Error(`Expected env variable ${key} wasn't found`)
    }

    return val
}

export default {
    DB_URL: assertEnv('DB_URL'),
    STRIPE_API_KEY: assertEnv('STRIPE_API_KEY'),
}