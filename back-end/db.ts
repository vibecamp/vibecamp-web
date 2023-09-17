import { Pool, PoolClient, Transaction } from 'postgres'
import env from './env.ts'

const url = new URL(env.DB_URL)

const db = new Pool({
    database: url.pathname.split('/')[1],
    hostname: url.hostname,
    password: url.password,
    port: url.port,
    user: url.username,
}, 20)

export async function withDBConnection<TResult>(cb: (db: Pick<PoolClient, 'queryObject' | 'queryArray'>) => Promise<TResult>): Promise<TResult> {
    const client = await db.connect()

    const result = await cb(client)

    client.release()
    return result
}

export async function withDBTransaction<TResult>(cb: (transaction: Pick<Transaction, 'queryObject' | 'queryArray'>) => Promise<TResult>): Promise<TResult> {
    return await withDBConnection(async db => {
        const transactionName = generateTransactionName()
        const transaction = (db as PoolClient).createTransaction(transactionName, {
            isolation_level: "serializable",
            read_only: true,
        })
        await transaction.begin()

        const result = await cb(transaction)

        await transaction.commit()
        releaseTransactionName(transactionName)

        return result
    })
}

function generateTransactionName(): string {
    let name = String(Math.random())
    while (ACTIVE_TRANSACTION_NAMES.has(name)) {
        // in the unlikely case we've generated a string that's already being
        // used, generate a new one
        name = String(Math.random())
    }

    ACTIVE_TRANSACTION_NAMES.add(name)
    return name
}

function releaseTransactionName(name: string) {
    ACTIVE_TRANSACTION_NAMES.delete(name)
}

const ACTIVE_TRANSACTION_NAMES = new Set<string>()