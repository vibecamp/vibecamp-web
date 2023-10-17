import { Pool, PoolClient, Transaction } from 'postgres'
import env from './env.ts'
import {
  REFERRAL_MAXES,
} from './common/constants.ts'
import { Tables } from './db-types.ts'

const url = new URL(env.DB_URL)

const db = new Pool({
  database: url.pathname.split('/')[1],
  hostname: url.hostname,
  password: url.password,
  port: url.port || 5432,
  user: url.username,
  connection: {
    attempts: 5,
    interval: (prevInterval) => {
      // Initial interval is always gonna be zero
      if (prevInterval === 0) return 1
      return prevInterval * 2
    }
  }
}, 20)

/**
 * Acquire a DB connection from the pool, perform queries with it, and then
 * release the connection and return any result
 * 
 * Using this wrapper function ensures pool connections are always released
 * back into the pool
 */
export async function withDBConnection<TResult>(
  cb: (db: Pick<PoolClient, 'queryObject' | 'createTransaction'>) => Promise<TResult>,
): Promise<TResult> {
  const client = await db.connect()
  try {
    const result = await cb(client)
    return result
  } finally {
    client.release()
  }
}

/**
 * Create a DB transaction, perform queries within it, and then
 * commit the transaction and release the connection, returning any result
 * 
 * Using this wrapper function ensures transactions are always committed when
 * finished
 */
export async function withDBTransaction<TResult>(
  cb: (transaction: Pick<Transaction, 'queryObject'>) => Promise<TResult>,
): Promise<TResult> {
  return await withDBConnection(async (db) => {
    const transactionName = generateTransactionName()
    try {
      const transaction = db.createTransaction(transactionName, {
        isolation_level: 'serializable',
      })
      await transaction.begin()

      const result = await cb(transaction)

      await transaction.commit()
      releaseTransactionName(transactionName)

      return result
    } finally {
      releaseTransactionName(transactionName)
    }
  })
}

/**
 * Get a unique and unused name for a transaction
 */
function generateTransactionName(): string {
  let name = 'Transaction_' + String(Math.random()).substring(2)
  while (ACTIVE_TRANSACTION_NAMES.has(name)) {
    // in the unlikely case we've generated a string that's already being
    // used, generate a new one
    name = 'Transaction_' + String(Math.random())
  }

  ACTIVE_TRANSACTION_NAMES.add(name)
  return name
}

function releaseTransactionName(name: string) {
  ACTIVE_TRANSACTION_NAMES.delete(name)
}

/**
 * Keep track of transaction names currently in use, to ensure against
 * collisions
 */
const ACTIVE_TRANSACTION_NAMES = new Set<string>()

/**
 * Determine whether or not the account can purchase tickets, and how many
 * invite codes they should be given to pass out
 */
export async function accountReferralStatus(
  db: Pick<Transaction, 'queryObject'>,
  account_id: number,
  festival_id: number | undefined
): Promise<{ allowedToRefer: number, allowedToPurchaseTickets: boolean }> {
  const none = { allowedToRefer: 0, allowedToPurchaseTickets: false }

  if (festival_id == null) {
    return none
  }

  const chain = (await db.queryObject<
    & Pick<Tables['account'], 'account_id' | 'is_seed_account'>
    & Pick<Tables['invite_code'], 'created_by_account_id'>
  >`
    select * from account_referral_chain(${account_id}, ${festival_id})
  `).rows

  // account doesn't exist
  if (chain.length === 0) {
    return none
  }

  // nobody in the referral chain is a seed account
  if (!chain.some((account) => account.is_seed_account)) {
    return none
  }

  const referralDistance = chain.length - 1
  return {
    allowedToRefer: REFERRAL_MAXES[referralDistance] ?? 0,
    allowedToPurchaseTickets: true,
  }
}
