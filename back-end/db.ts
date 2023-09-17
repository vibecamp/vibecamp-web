import { Pool, PoolClient } from 'postgres'
import env from './env.ts'

const url = new URL(env.DB_URL)

const db = new Pool({
    database: url.pathname.split('/')[1],
    hostname: url.hostname,
    password: url.password,
    port: url.port,
    user: url.username,
}, 20)

export async function withDBConnection<TResult>(cb: (db: Pick<PoolClient, 'queryObject' | 'queryArray' | 'createTransaction'>) => Promise<TResult>): Promise<TResult> {
    const client = await db.connect()

    const result = await cb(client)

    client.release()
    return result
}
