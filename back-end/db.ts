import { DB } from './db.d.ts' // this is the Database interface we defined earlier
import Pool from 'pg-pool'
import { Kysely, PostgresDialect } from 'kysely'
import env from './env.ts'

const url = new URL(env.DB_URL)

const dialect = new PostgresDialect({
    pool: new Pool({
        host: url.host,
        port: url.port,
        database: url.pathname.split('/')[1],
        user: url.username,
        password: url.password,
        ssl: true,
        max: 10,
    })
})

// Database interface is passed to Kysely's constructor, and from now on, Kysely 
// knows your database structure.
// Dialect is passed to Kysely's constructor, and from now on, Kysely knows how 
// to communicate with your database.
export const db = new Kysely<DB>({
    dialect,
})

console.log(
    await db.selectFrom('event').where('event_id', '=', 1).selectAll().executeTakeFirst()
)