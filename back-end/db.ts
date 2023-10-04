import { Pool, PoolClient, Transaction } from 'postgres'
import env from './env.ts'
import { FullAccountInfo, Maybe } from './common/data.ts'
import {
  MAX_ADULT_TICKETS_PER_ACCOUNT,
  REFERRAL_MAXES,
} from './common/constants.ts'
import { Account, Attendee, InviteCode, Ticket } from './db.d.ts'
import { allPromises } from './utils.ts'

const url = new URL(env.DB_URL)

const db = new Pool({
  database: url.pathname.split('/')[1],
  hostname: url.hostname,
  password: url.password,
  port: url.port || 5432,
  user: url.username,
}, 20)

export async function withDBConnection<TResult>(
  cb: (db: Pick<PoolClient, 'queryObject'>) => Promise<TResult>,
): Promise<TResult> {
  const client = await db.connect()

  const result = await cb(client)

  client.release()
  return result
}

export async function withDBTransaction<TResult>(
  cb: (transaction: Pick<Transaction, 'queryObject'>) => Promise<TResult>,
): Promise<TResult> {
  return await withDBConnection(async (db) => {
    const transactionName = generateTransactionName()
    const transaction = (db as PoolClient).createTransaction(transactionName, {
      isolation_level: 'serializable',
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

// domain-specific

export async function accountReferralStatus(
  db: Pick<Transaction, 'queryObject'>,
  account_id: number,
): Promise<{ allowedToRefer: number; allowedToPurchaseTickets: number }> {
  const res = await db.queryObject<
    {
      account_id: number
      is_seed_account: boolean
      created_by_account_id: Maybe<number>
    }
  >`
        WITH RECURSIVE referrals AS (
            SELECT account_id, is_seed_account, created_by_account_id as referred_by FROM account LEFT JOIN invite_code ON account.account_id = invite_code.used_by_account_id
        ), referral_chain AS (
            SELECT *
            FROM referrals
            WHERE referrals.account_id = ${account_id}
        UNION
            SELECT referrals.account_id, referrals.is_seed_account, referrals.referred_by
            FROM referrals, referral_chain
            WHERE referrals.account_id = referral_chain.referred_by
        )
        SELECT * FROM referral_chain
    `
  const chain = res.rows

  const none = { allowedToRefer: 0, allowedToPurchaseTickets: 0 }

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
    allowedToPurchaseTickets: MAX_ADULT_TICKETS_PER_ACCOUNT,
  }
}

export async function fullAccountInfo(
  account_id: number,
): Promise<Maybe<FullAccountInfo>> {
  const {
    referralStatus: { allowedToPurchaseTickets },
    accounts,
    attendees,
    tickets,
  } = await withDBTransaction(async (db) => {
    return await allPromises({
      referralStatus: accountReferralStatus(db, account_id),
      accounts: db.queryObject<Account>`
                SELECT * FROM account WHERE account_id = ${account_id}
            `,
      attendees: db.queryObject<Attendee>`
                SELECT * FROM attendee WHERE associated_account_id = ${account_id}
            `,
      tickets: db.queryObject<Ticket>`
                SELECT * FROM ticket WHERE owned_by_account_id = ${account_id}
            `,
    })
  })

  const account = accounts.rows[0]
  if (account != null) {
    return {
      account_id: account.account_id,
      email_address: account.email_address,
      allowed_to_purchase_tickets: allowedToPurchaseTickets,
      attendees: attendees.rows,
      tickets: tickets.rows,
    }
  }
}

export async function useInviteCode(
  account_id: number,
  invite_code: string,
): Promise<boolean> {
  try {
    return await withDBTransaction(async (db) => {
      const inviteCodeResult = await db.queryObject<InviteCode>`
                SELECT * FROM invite_code WHERE code = ${invite_code}
            `
      const invite_code_id = inviteCodeResult.rows[0]?.invite_code_id

      if (invite_code_id == null) {
        // invite code doesn't exist
        return false
      }

      const accountsWithInviteCode = await db.queryObject<Account>`
                SELECT * FROM account WHERE account.invite_code_id = ${invite_code_id}
            `

      if (accountsWithInviteCode.rows.length > 0) {
        // invite code already used
        return false
      }

      const accountResult = await db.queryObject<Account>`
                SELECT * FROM account WHERE account.account_id = ${account_id}
            `
      const currentAccount = accountResult.rows[0]
      if (currentAccount == null) {
        // account doesn't exist
        return false
      }

      if (currentAccount.invite_code_id != null) {
        // account already used an invite code
        return false
      }

      await db.queryObject`
                UPDATE account SET invite_code_id = ${invite_code_id}
                WHERE account_id = ${account_id}
            `

      return true
    })
  } catch {
    return false
  }
}
