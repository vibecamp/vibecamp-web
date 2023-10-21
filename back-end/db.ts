import { Pool, PoolClient, Transaction } from 'postgres'
import env from './env.ts'
import {
  REFERRAL_MAXES,
} from './common/constants.ts'
import { TableName, Tables } from './db-types.ts'
import { Maybe } from "./common/types.ts"
import { objectEntries } from './common/utils.ts'
import { _format } from 'https://deno.land/std@0.160.0/path/_util.ts'

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
  cb: (db: Pick<PoolClient, 'queryObject' | 'createTransaction'> & CustomClientMethods) => Promise<TResult>,
): Promise<TResult> {
  const client = await db.connect() as unknown as Pick<PoolClient, 'queryObject' | 'createTransaction' | 'release'> & CustomClientMethods
  try {
    client.queryTable = queryTable(client)
    client.insertTable = insertTable(client)
    client.updateTable = updateTable(client)

    // deno-lint-ignore no-explicit-any
    const result = await cb(client as any)
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
  cb: (db: Pick<Transaction, 'queryObject'> & CustomClientMethods) => Promise<TResult>,
): Promise<TResult> {
  return await withDBConnection(async (db) => {
    const transactionName = generateTransactionName()
    try {
      const transaction = db.createTransaction(transactionName, {
        isolation_level: 'serializable',
      }) as unknown as Pick<Transaction, 'queryObject' | 'begin' | 'commit'> & CustomClientMethods
      await transaction.begin();

      transaction.queryTable = queryTable(transaction)
      transaction.insertTable = insertTable(transaction)
      transaction.updateTable = updateTable(transaction)

      // deno-lint-ignore no-explicit-any
      const result = await cb(transaction as any)

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
  updateTable: ReturnType<typeof updateTable>
}

const queryTable = (db: Pick<PoolClient, 'queryObject'>) =>
  async <
    TTableName extends TableName,
    TColumnName extends keyof Tables[TTableName],
  >(
    table: TTableName,
    { where }: { where?: WhereClause<TTableName, TColumnName> } = {}
  ): Promise<Tables[TTableName][]> => {
    if (where != null) {
      const [column, op, value] = where

      return (await db.queryObject<Tables[TTableName]>(
        `SELECT * FROM ${table} WHERE ${column as string} ${op} $1`,
        [value]
      )).rows
    } else {
      return (await db.queryObject<Tables[TTableName]>(
        `SELECT * FROM ${table}`
      )).rows
    }
  }

const insertTable = (db: Pick<PoolClient, 'queryObject'>) =>
  async <
    TTableName extends TableName
  >(
    table: TTableName,
    row: Partial<Tables[TableName]>
  ): Promise<Tables[TTableName][]> => {
    const rowEntries = objectEntries(row)

    const columnNames = rowEntries.map(([columnName]) => columnName).join(', ')
    const columnValues = rowEntries.map(([_, value]) => value)
    const columnNumbers = rowEntries.map((_, index) => `$${index + 1}`).join(', ')

    return (await db.queryObject<Tables[TTableName]>(
      `
        INSERT INTO ${table}
          (${columnNames})
          VALUES (${columnNumbers}})
        RETURNING *
      `,
      columnValues
    )).rows
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
    const rowEntries = objectEntries(row)

    const columnAssignments = rowEntries.map(([column], index) => `${column} = $${index + 1}`).join('\n')
    const columnValues = rowEntries.map(([_, value]) => value)

    const whereClauses = where.map(([column, op], index) => `${column as string} ${op} $${columnAssignments.length + index + 1}`).join(' AND ')
    const whereValues = where.map(([_column, _op, value]) => value)

    return (await db.queryObject<Tables[TTableName]>(
      `
        UPDATE ${table}
          SET
            ${columnAssignments}
          WHERE
            ${whereClauses}
          RETURNING *
      `,
      [...columnValues, ...whereValues]
    )).rows
  }

type WhereClause<
  TTableName extends TableName,
  TColumnName extends keyof Tables[TTableName],
> = [TColumnName, '=' | '<' | '>', Tables[TTableName][TColumnName]]

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
  festival_id: Maybe<number>
): Promise<{ allowedToRefer: number, allowedToPurchase: boolean }> {
  const none = { allowedToRefer: 0, allowedToPurchase: false }

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
    allowedToPurchase: true,
  }
}
