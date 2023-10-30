import { Router, Status } from 'oak'
import { defineRoute, rateLimited } from './_common.ts'
import { accountReferralStatus, withDBConnection, withDBTransaction } from '../../db.ts'
import { Tables } from "../../db-types.ts"
import { allPromises } from "../../common/utils.ts"
import { ONE_SECOND_MS } from '../../common/constants.ts'

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
    handler: async ({ jwt: { account_id }, body: { age_group, attendee_id, special_diet, has_allergy_eggs, has_allergy_fish, has_allergy_shellfish, has_allergy_soy, has_allergy_wheat, has_allergy_milk, has_allergy_peanuts, has_allergy_tree_nuts, discord_handle, interested_in_pre_call, interested_in_volunteering_as, name, planning_to_camp } }) => {
      const attendee = await withDBConnection(async db =>
        (await db.updateTable('attendee', {
          age_group,
          discord_handle,
          interested_in_pre_call,
          interested_in_volunteering_as,
          special_diet,
          has_allergy_eggs,
          has_allergy_fish,
          has_allergy_shellfish,
          has_allergy_soy,
          has_allergy_wheat,
          has_allergy_milk,
          has_allergy_peanuts,
          has_allergy_tree_nuts,
          name,
          planning_to_camp
        }, [
          ['associated_account_id', '=', account_id],
          ['attendee_id', '=', attendee_id],
        ]))[0])

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
    handler: rateLimited(ONE_SECOND_MS, async ({ jwt, body: { invite_code } }) => {
      const { account_id } = jwt

      try {
        return await withDBTransaction(async (db) => {
          const inviteCodeResult = (await db.queryTable('invite_code', { where: ['code', '=', invite_code] }))[0]

          if (inviteCodeResult == null) {
            // invite code doesn't exist
            return [null, Status.InternalServerError]
          }

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

          await db.updateTable('invite_code', {
            used_by_account_id: account_id
          }, [['code', '=', invite_code]])

          return [null, Status.OK]
        })
      } catch (e) {
        console.error(e)
        return [null, Status.InternalServerError]
      }
    }),
  })
}
