import { drizzle } from 'drizzle-orm/node-postgres'
import { Pool } from 'pg'
import { env } from '@/env'
import * as schema from './schema'

const url = new URL(env.DATABASE_URL)

const pool = new Pool({
    connectionString: env.DATABASE_URL,
    max: 10,

    ssl: url.hostname.endsWith('.render.com') ? { rejectUnauthorized: true } : undefined,
})

export const db = drizzle({ client: pool, schema })

export type Db = typeof db
export type Tx = Parameters<Parameters<Db['transaction']>[0]>[0]

export function transaction<T>(fn: (tx: Tx) => Promise<T>): Promise<T> {
    return db.transaction(fn, { isolationLevel: 'serializable' })
}
