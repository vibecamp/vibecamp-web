import { Router, Status } from 'oak'
import { defineRoute } from './_common.ts'
import { accountReferralStatus, withDBConnection, withDBTransaction } from '../../db.ts'
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
        referralStatus: { allowedToPurchase },
        accounts,
        attendees,
        purchases,
        inviteCodes,
      } = await withDBTransaction(async (db) => {
        return await allPromises({
          referralStatus: accountReferralStatus(db,
            account_id,
            (await db.queryTable('next_festival'))[0]?.festival_id
          ),
          accounts: db.queryTable('account', { where: ['account_id', '=', account_id] }),
          attendees: db.queryTable('attendee', { where: ['associated_account_id', '=', account_id] }),
          purchases: db.queryTable('purchase', { where: ['owned_by_account_id', '=', account_id] }),
          inviteCodes: db.queryObject<Tables['invite_code'] & { used_by: string | null }>`
            SELECT invite_code_id, code, email_address as used_by FROM invite_code
            LEFT JOIN account ON account_id = used_by_account_id
            WHERE created_by_account_id = ${account_id}
          `,
        })
      })

      const account = accounts[0]

      if (account != null) {
        return [
          {
            account_id: account.account_id,
            email_address: account.email_address,
            allowed_to_purchase: allowedToPurchase,
            attendees,
            purchases,
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
    endpoint: '/account/create-attendee',
    method: 'post',
    requireAuth: true,
    handler: async ({ jwt: { account_id }, body }) => {
      const attendee = await withDBConnection(async db =>
        (await db.insertTable('attendee', {
          associated_account_id: account_id,
          ...body
        }))[0])

      if (attendee == null) {
        return [null, Status.InternalServerError]
      }

      return [attendee, Status.OK]
    }
  })

  defineRoute(router, {
    endpoint: '/account/update-attendee',
    method: 'put',
    requireAuth: true,
    handler: async ({ jwt: { account_id }, body: { age_group, attendee_id, dietary_restrictions, discord_handle, interested_in_pre_call, interested_in_volunteering, name, planning_to_camp } }) => {
      const attendee = await withDBConnection(async db =>
        (await db.queryObject<Tables['attendee']>`
          UPDATE attendee
          SET
            age_group = ${age_group}
            dietary_restrictions = ${dietary_restrictions}
            discord_handle = ${discord_handle}
            interested_in_pre_call = ${interested_in_pre_call}
            interested_in_volunteering = ${interested_in_volunteering}
            name = ${name}
            planning_to_camp = ${planning_to_camp}
          WHERE
            associated_account_id = ${account_id} AND
            attendee_id = ${attendee_id}
          RETURNING *
        `).rows[0])

      if (attendee == null) {
        return [null, Status.InternalServerError]
      }

      return [attendee, Status.OK]
    }
  })

  defineRoute(router, {
    endpoint: '/account/submit-invite-code',
    method: 'post',
    requireAuth: true,
    handler: async ({ jwt, body: { invite_code } }) => {
      const { account_id } = jwt

      try {
        return await withDBTransaction(async (db) => {
          const inviteCodeResult = (await db.queryTable('invite_code', { where: ['code', '=', invite_code] }))[0]

          if (inviteCodeResult == null) {
            // invite code doesn't exist
            return [null, Status.InternalServerError]
          }

          const invite_code_id = inviteCodeResult.invite_code_id

          if (inviteCodeResult.used_by_account_id != null) {
            // invite code already used
            return [null, Status.InternalServerError]
          }

          const accountResult = await db.queryTable('account', { where: ['account_id', '=', account_id] })
          const currentAccount = accountResult[0]
          if (currentAccount == null) {
            // account doesn't exist
            return [null, Status.InternalServerError]
          }

          const codeUsedByCurrentAccount = (await db.queryTable('invite_code', { where: ['used_by_account_id', '=', account_id] }))[0]
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
