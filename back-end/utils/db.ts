import { Pool, PoolClient, Transaction } from 'postgres'
import env from '../env.ts'
import {
  REFERRAL_MAXES,
} from './constants.ts'
import { TableName, Tables } from '../types/db-types.ts'
import { Maybe } from "../types/misc.ts"
import { _format } from 'https://deno.land/std@0.160.0/path/_util.ts'
import { WhereClause, queryTableQuery, insertTableQuery, updateTableQuery, deleteTableQuery } from './db-inner.ts'

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
}, env.DB_CONNECTION_POOL_SIZE)

function handleShutdown() {
  console.log("Releasing DB connections...")
  try {
    db.end()
    console.log('connections released')
  } catch {
    console.log('connections had already been released')
  }

  Deno.exit()
}

Deno.addSignalListener('SIGINT', handleShutdown)
Deno.addSignalListener('SIGTERM', handleShutdown)

export type DBClient = Pick<PoolClient, 'queryObject'> & CustomClientMethods

/**
 * Acquire a DB connection from the pool, perform queries with it, and then
 * release the connection and return any result
 * 
 * Using this wrapper function ensures pool connections are always released
 * back into the pool
 */
export async function withDBConnection<TResult>(
  cb: (db: DBClient & Pick<PoolClient, 'createTransaction'>) => Promise<TResult>,
): Promise<TResult> {
  const client = await db.connect() as unknown as DBClient & Pick<PoolClient, 'createTransaction' | 'release'>
  client.queryTable = queryTable(client)
  client.insertTable = insertTable(client)
  client.updateTable = updateTable(client)
  client.deleteTable = deleteTable(client)

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
  cb: (db: DBClient) => Promise<TResult>,
): Promise<TResult> {
  return await withDBConnection(async (db) => {
    const transactionName = generateTransactionName()
    try {
      const transaction = db.createTransaction(transactionName, {
        isolation_level: 'serializable',
      }) as unknown as DBClient & Pick<Transaction, 'begin' | 'commit'>
      await transaction.begin();

      transaction.queryTable = queryTable(transaction)
      transaction.insertTable = insertTable(transaction)
      transaction.updateTable = updateTable(transaction)
      transaction.deleteTable = deleteTable(transaction)

      const result = await cb(transaction)

      await transaction.commit()
      releaseTransactionName(transactionName)

      return result
    } finally {
      releaseTransactionName(transactionName)
    }
  })
}

type CustomClientMethods = {
  queryTable: ReturnType<typeof queryTable>,
  insertTable: ReturnType<typeof insertTable>,
  updateTable: ReturnType<typeof updateTable>,
  deleteTable: ReturnType<typeof deleteTable>
}

const queryTable = (db: Pick<PoolClient, 'queryObject'>) =>
  async <
    TTableName extends TableName,
    TColumnName extends keyof Tables[TTableName],
  >(
    table: TTableName,
    opts: { where?: WhereClause<TTableName, TColumnName> } = {}
  ): Promise<Tables[TTableName][]> => {
    return (await db.queryObject<Tables[TTableName]>(...queryTableQuery(table, opts))).rows
  }

const insertTable = (db: Pick<PoolClient, 'queryObject'>) =>
  async <
    TTableName extends TableName
  >(
    table: TTableName,
    row: Partial<Tables[TableName]>
  ): Promise<Tables[TTableName]> => {
    return (await db.queryObject<Tables[TTableName]>(...insertTableQuery(table, row))).rows[0]!
  }

const updateTable = (db: Pick<PoolClient, 'queryObject'>) =>
  async <
    TTableName extends TableName,
    TColumnNames extends Array<keyof Tables[TTableName]>
  >(
    table: TTableName,
    row: Partial<Tables[TableName]>,
    where: WhereClause<TTableName, TColumnNames[number]>[]
  ): Promise<Tables[TTableName][]> => {
    return (await db.queryObject<Tables[TTableName]>(...updateTableQuery(table, row, where))).rows
  }

const deleteTable = (db: Pick<PoolClient, 'queryObject'>) =>
  async <
    TTableName extends TableName,
    TColumnNames extends Array<keyof Tables[TTableName]>
  >(
    table: TTableName,
    where: WhereClause<TTableName, TColumnNames[number]>[]
  ): Promise<void> => {
    await db.queryObject<Tables[TTableName]>(...deleteTableQuery(table, where))
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
  db: DBClient,
  account_id: Tables['account']['account_id'],
  festival_id: Maybe<Tables['festival']['festival_id']>
): Promise<{ allowedToRefer: number, allowedToPurchase: boolean }> {
  const none = { allowedToRefer: 0, allowedToPurchase: false }

  if (festival_id == null) {
    return none
  }

  const account = (await db.queryTable('account', { where: ['account_id', '=', account_id] }))[0]!

  // invite code chain
  const chain = (await db.queryObject<
    & Pick<Tables['account'], 'account_id' | 'is_seed_account'>
    & Pick<Tables['invite_code'], 'created_by_account_id'>
  >`
    SELECT * FROM account_referral_chain(${account_id}, ${festival_id})
  `).rows

  // account doesn't exist
  if (chain.length === 0) {
    return none
  }

  // somebody in the referral chain is a seed account
  if (chain.some(account => account.is_seed_account)) {
    const referralDistance = chain.length - 1
    return {
      allowedToRefer: REFERRAL_MAXES[referralDistance] ?? 0,
      allowedToPurchase: true,
    }
  }

  return {
    allowedToRefer: 0,
    allowedToPurchase:
      account.is_authorized_to_buy_tickets ||
      (await getApplicationStatus(account) === 'accepted')
  }
}

export async function getApplicationStatus(account: Tables['account']) {
  const { application_id } = account

  if (application_id != null) {
    const application = (await withDBConnection(db => db.queryTable('application', { where: ['application_id', '=', application_id] })))[0]!

    switch (application.is_accepted) {
      case true: return 'accepted'
      case false: return 'rejected'
      case null: return 'pending'
    }
  }

  return 'unsubmitted'
}