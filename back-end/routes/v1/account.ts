import { Router, Status } from 'oak'
import { defineRoute } from './_common.ts'
import { accountReferralStatus, withDBTransaction } from '../../db.ts'
import { Tables } from "../../db-types.ts"
import { allPromises } from "../../utils.ts"

export default function register(router: Router) {

  // purchase one or multiple tickets, fill out baseline required attendee info
  defineRoute(router, {
    endpoint: '/account',
    method: 'get',
    requireAuth: true,
    handler: async ({ jwt }) => {
      const { account_id } = jwt

      const {
        referralStatus: { allowedToPurchaseTickets },
        accounts,
        attendees,
        tickets,
        inviteCodes,
      } = await withDBTransaction(async (db) => {

        return await allPromises({
          referralStatus: accountReferralStatus(db,
            account_id,
            (await db.queryObject<Tables['festival']>`select * from next_festival`).rows[0]?.festival_id
          ),
          accounts: db.queryObject<Tables['account']>`
            SELECT * FROM account WHERE account_id = ${account_id}
          `,
          attendees: db.queryObject<Tables['attendee']>`
            SELECT * FROM attendee WHERE associated_account_id = ${account_id}
          `,
          tickets: db.queryObject<Tables['ticket']>`
            SELECT * FROM ticket WHERE owned_by_account_id = ${account_id}
          `,
          inviteCodes: db.queryObject<Tables['invite_code'] & { used_by: string | null }>`
            SELECT invite_code_id, code, email_address as used_by FROM invite_code
            LEFT JOIN account ON account_id = used_by_account_id
            WHERE created_by_account_id = ${account_id}
          `,
        })
      })

      const account = accounts.rows[0]
      if (account != null) {
        return [
          {
            account_id: account.account_id,
            email_address: account.email_address,
            allowed_to_purchase_tickets: allowedToPurchaseTickets,
            attendees: attendees.rows,
            tickets: tickets.rows,
            inviteCodes: inviteCodes.rows
          },
          Status.OK
        ]
      } else {
        return [null, Status.NotFound]
      }
    },
  })

  defineRoute(router, {
    endpoint: '/account/submit-invite-code',
    method: 'post',
    requireAuth: true,
    handler: async ({ jwt, body: { invite_code } }) => {
      const { account_id } = jwt

      try {
        return await withDBTransaction(async (db) => {
          const inviteCodeResult = (await db.queryObject<Tables['invite_code']>`
            SELECT * FROM invite_code WHERE code = ${invite_code}
          `).rows[0]

          if (inviteCodeResult == null) {
            // invite code doesn't exist
            return [null, Status.InternalServerError]
          }

          const invite_code_id = inviteCodeResult.invite_code_id

          if (inviteCodeResult.used_by_account_id != null) {
            // invite code already used
            return [null, Status.InternalServerError]
          }

          const accountResult = await db.queryObject<Tables['account']>`
            SELECT * FROM account WHERE account_id = ${account_id}
          `
          const currentAccount = accountResult.rows[0]
          if (currentAccount == null) {
            // account doesn't exist
            return [null, Status.InternalServerError]
          }

          const codeUsedByCurrentAccount = (await db.queryObject<Tables['invite_code']>`
            SELECT * FROM invite_code WHERE used_by_account_id = ${account_id}
          `).rows[0]
          if (codeUsedByCurrentAccount != null) {
            // this account already used an invite code
            return [null, Status.InternalServerError]
          }

          await db.queryObject`
            UPDATE invite_code SET used_by_account_id = ${account_id}
            WHERE invite_code_id = ${invite_code_id}
          `

          return [null, Status.OK]
        })
      } catch (e) {
        console.error(e)
        return [null, Status.InternalServerError]
      }
    },
  })
}
