import { Pool, Client } from '../deps/postgres.ts'

// export const pool = new Pool(
//     Deno.env.get('DB_CONNECTION_STRING'),
//     10
// )

// await pool.connect()

export async function borrowConnection<T>(fn: (conn: Client) => Promise<T>) {
    // const client = await pool.connect()
    // const res = await fn(client)
    // client.release()
    // return res

    const client = new Client(Deno.env.get('DB_CONNECTION_STRING'))
    await client.connect()
    const res = await fn(client)
    await client.end()
    return res
}