import { Router, Status } from 'oak'
import { defineRoute, rateLimited } from './_common.ts'
import { accountReferralStatus, withDBConnection, withDBTransaction } from '../../utils/db.ts'
import { Tables } from "../../types/db-types.ts"
import { allPromises } from "../../utils/misc.ts"
import { ONE_SECOND_MS } from '../../utils/constants.ts'

export default function register(router: Router) {

  // purchase one or multiple tickets, fill out baseline required attendee info
  defineRoute(router, {
    endpoint: '/account',
    method: 'get',
    requireAuth: true,
    handler: async ({ jwt }) => {
      const { account_id } = jwt

      const {
        nextFestival,
        referralStatus: { allowedToPurchase, allowedToRefer },
        accounts,
        attendees,
        purchases,
        inviteCodes,
      } = await withDBTransaction(async (db) => {
        const nextFestival: Tables['next_festival'] | undefined = (await db.queryTable('next_festival'))[0]

        return {
          nextFestival,

          ...await allPromises({
            referralStatus: accountReferralStatus(db,
              account_id,
              nextFestival?.festival_id
            ),
            accounts: db.queryTable('account', { where: ['account_id', '=', account_id] }),
            attendees: db.queryTable('attendee', { where: ['associated_account_id', '=', account_id] }),
            purchases: db.queryTable('purchase', { where: ['owned_by_account_id', '=', account_id] }),
            inviteCodes: db.queryObject<Tables['invite_code'] & { used_by: string | null }>`
              SELECT code, email_address as used_by FROM invite_code
              LEFT JOIN account ON account_id = used_by_account_id
              WHERE created_by_account_id = ${account_id}
            `,
          })
        }
      })

      const account = accounts[0]

      if (account != null) {

        // if this account should have invite codes, and has less than they should, create more
        const uncreatedInviteCodes = allowedToRefer - inviteCodes.rows.length
        if (uncreatedInviteCodes > 0) {
          await withDBTransaction(async (db) => {
            if (nextFestival?.festival_id != null) {
              for (let i = 0; i < uncreatedInviteCodes; i++) {
                await db.insertTable('invite_code', {
                  created_by_account_id: account.account_id,
                  festival_id: nextFestival.festival_id
                })
              }
            }
          })
        }

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
    handler: async ({ jwt: { account_id }, body: { age_group, attendee_id, diet, has_allergy_eggs, has_allergy_fish, has_allergy_shellfish, has_allergy_soy, has_allergy_wheat, has_allergy_milk, has_allergy_peanuts, has_allergy_tree_nuts, discord_handle, interested_in_pre_call, interested_in_volunteering_as, name, planning_to_camp } }) => {
      const attendee = await withDBConnection(async db =>
        (await db.updateTable('attendee', {
          age_group,
          discord_handle,
          interested_in_pre_call,
          interested_in_volunteering_as,
          diet,
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

      return await withDBTransaction(async (db) => {
        const inviteCodeResult = (await db.queryTable('invite_code', { where: ['code', '=', invite_code] }))[0]

        if (inviteCodeResult == null) {
          // invite code doesn't exist
          throw Error(`Invalid invite code submitted: "${invite_code}"`)
        }

        if (inviteCodeResult.used_by_account_id != null) {
          // invite code already used
          throw Error(`Already-used invite code submitted: "${invite_code}"`)
        }

        const accountResult = await db.queryTable('account', { where: ['account_id', '=', account_id] })
        const currentAccount = accountResult[0]
        if (currentAccount == null) {
          // account doesn't exist
          throw Error(`Tried to submit invite code from account that doesn't exist: "${account_id}"`)
        }

        const codeUsedByCurrentAccount = (await db.queryTable('invite_code', { where: ['used_by_account_id', '=', account_id] }))[0]
        if (codeUsedByCurrentAccount != null) {
          // this account already used an invite code
          throw Error(`Account tried to submit an invite code but has already used one: "${account_id}"`)
        }

        await db.updateTable('invite_code', {
          used_by_account_id: account_id
        }, [['code', '=', invite_code]])

        return [null, Status.OK]
      })
    }),
  })
}
