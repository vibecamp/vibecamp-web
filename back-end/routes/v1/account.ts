import { Router, Status } from 'oak'
import { defineRoute, rateLimited } from './_common.ts'
import { DBClient, accountReferralStatus, withDBConnection, withDBTransaction, getApplicationStatus } from '../../utils/db.ts'
import { Tables } from "../../types/db-types.ts"
import { allPromises } from "../../utils/misc.ts"
import { ONE_SECOND_MS } from '../../utils/constants.ts'
import { hashAndSaltPassword } from './auth.ts'
import { getPasswordValidationError, getUuidValidationError } from '../../utils/validation.ts'

export default function register(router: Router) {

  // purchase one or multiple tickets, fill out baseline required attendee info
  defineRoute(router, {
    endpoint: '/account',
    method: 'get',
    requireAuth: true,
    handler: async ({ jwt }) => {
      const { account_id } = jwt

      const queryInviteCodes = async (db: DBClient) => (await db.queryObject<Tables['invite_code'] & { email_address: string | null }>`
        SELECT code, email_address FROM invite_code
        LEFT JOIN account ON account_id = used_by_account_id
        WHERE created_by_account_id = ${account_id}
      `).rows.map(({ email_address, ...invite_code }) => ({
        ...invite_code,
        used_by: email_address
      }))

      const {
        nextFestival,
        referralStatus: { allowedToPurchase, allowedToRefer },
        accounts,
        attendees,
        purchases,
        currentInviteCodes,
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
            currentInviteCodes: queryInviteCodes(db)
          })
        }
      })

      const account = accounts[0]

      if (account != null) {
        let inviteCodes = currentInviteCodes

        // if this account should have invite codes, and has less than they should, create more
        const uncreatedInviteCodes = allowedToRefer - currentInviteCodes.length
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
          inviteCodes = await withDBConnection(db => queryInviteCodes(db))
        }

        const applicationStatus = await getApplicationStatus(account)

        return [
          {
            account_id: account.account_id,
            email_address: account.email_address,
            application_status: applicationStatus,
            allowed_to_purchase: allowedToPurchase,
            attendees,
            purchases,
            inviteCodes
          },
          Status.OK
        ]
      } else {
        return [null, Status.NotFound]
      }
    },
  })

  defineRoute(router, {
    endpoint: '/account/update-email',
    method: 'put',
    requireAuth: true,
    handler: async ({ jwt: { account_id }, body: { email_address: raw_email_address } }) => {
      const email_address = raw_email_address.toLowerCase()

      await withDBConnection(db =>
        db.updateTable('account', { email_address }, [
          ['account_id', '=', account_id],
        ]))

      return [null, Status.OK]
    }
  })

  defineRoute(router, {
    endpoint: '/account/update-password',
    method: 'put',
    requireAuth: true,
    handler: async ({ jwt: { account_id }, body: { password } }) => {

      if (getPasswordValidationError(password)) {
        return [null, Status.BadRequest]
      }

      const { password_hash, password_salt } = await hashAndSaltPassword(
        password
      )

      await withDBConnection(db =>
        db.updateTable('account', { password_hash, password_salt }, [
          ['account_id', '=', account_id],
        ]))

      return [null, Status.OK]
    }
  })

  defineRoute(router, {
    endpoint: '/account/update-attendee',
    method: 'put',
    requireAuth: true,
    handler: async ({ jwt: { account_id }, body: { attendee_id, ...attendeeUpdate } }) => {
      const attendee = await withDBConnection(async db =>
        (await db.updateTable('attendee', attendeeUpdate, [
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

      // we do our own check because postgres will throw an error on a
      // malformed uuid, causing a 500 response
      if (getUuidValidationError(invite_code) != null) {
        // invite code doesn't exist
        console.error(`Invalid invite code submitted: "${invite_code}"`)
        return [null, Status.NotFound]
      }

      return await withDBTransaction(async (db) => {
        const inviteCodeResult = (await db.queryTable('invite_code', { where: ['code', '=', invite_code] }))[0]

        if (inviteCodeResult == null) {
          // invite code doesn't exist
          console.error(`Invalid invite code submitted: "${invite_code}"`)
          return [null, Status.NotFound]
        }

        if (inviteCodeResult.used_by_account_id != null) {
          // invite code already used
          console.error(`Already-used invite code submitted: "${invite_code}"`)
          return [null, Status.Forbidden]
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

  defineRoute(router, {
    endpoint: '/account/submit-application',
    method: 'post',
    requireAuth: true,
    handler: async ({ jwt: { account_id }, body: application }) => {
      const {
        anything_else,
        attractive_virtues,
        experiences_hoping_to_share,
        group_activity,
        hoping_to_get_out_of_the_festival,
        how_found_out,
        identify_as,
        interested_in_volunteering,
        last_conversation,
        looking_forward_to_conversations,
        name,
        previous_events,
        strongest_virtues,
        twitter_handle,
      } = application

      return await withDBConnection(async db => {
        const account = (await db.queryTable('account', { where: ['account_id', '=', account_id] }))[0]!

        if (account.application_id != null) {
          return [null, Status.BadRequest]
        }

        const application = await db.insertTable('application', {
          anything_else,
          attractive_virtues,
          experiences_hoping_to_share,
          group_activity,
          hoping_to_get_out_of_the_festival,
          how_found_out,
          identify_as,
          interested_in_volunteering,
          last_conversation,
          looking_forward_to_conversations,
          name,
          previous_events,
          strongest_virtues,
          twitter_handle,
        })

        const { application_id } = application

        await db.updateTable('account', { application_id }, [['account_id', '=', account_id]])

        return [null, Status.OK]
      })

    }
  })
}
