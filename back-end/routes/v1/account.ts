import { Router, Status } from 'oak'
import { defineRoute, rateLimited } from './_common.ts'
import {
  getApplicationStatus,
  withDBConnection,
  withDBTransaction,
} from '../../utils/db.ts'
import { Tables } from '../../types/db-types.ts'
import { allPromises } from '../../utils/misc.ts'
import { ONE_SECOND_MS } from '../../utils/constants.ts'
import { createAccountJwt, hashAndSaltPassword } from './auth.ts'
import {
  getPasswordValidationError,
  getUuidValidationError,
} from '../../utils/validation.ts'
import { passwordResetEmail, sendMail } from '../../utils/mailgun.ts'
import dayjs, { Dayjs } from '../../utils/dayjs.ts'
import { assert } from 'https://deno.land/std@0.160.0/testing/asserts.ts'
import { stringifyDate } from './event.ts'

// Hiding cabins for non-team members until day before festival starts. Day
// before instead of day of because this gets rid of risk of timezone issues
const shouldShowCabinsForFestival = (now: Dayjs, festivalStartDate: Dayjs, isTeamMember: boolean) => {
  const dayBeforeFestival = festivalStartDate.subtract(1, 'day')
  return isTeamMember || now.isAfter(dayBeforeFestival) || now.isSame(dayBeforeFestival)
}

Deno.test({
  name: 'shouldShowCabinsForFestival()',
  fn() {
    const festival = dayjs('6/15/2024')
    assert(shouldShowCabinsForFestival(dayjs('6/15/2030'), festival, false)) // festival is far in the past
    assert(!shouldShowCabinsForFestival(dayjs('6/15/2020'), festival, false)) // festival is far in the future
    assert(shouldShowCabinsForFestival(dayjs('6/15/2020'), festival, true)) // festival is far in the future, but we're a team member
    assert(shouldShowCabinsForFestival(dayjs('6/16/2024'), festival, false)) // festival just started
    assert(shouldShowCabinsForFestival(dayjs('6/14/2024'), festival, false)) // festival is about to start
    assert(!shouldShowCabinsForFestival(dayjs('6/13/2024'), festival, false)) // festival isn't quite about to start
  }
})

export default function register(router: Router) {
  // purchase one or multiple tickets, fill out baseline required attendee info
  defineRoute(router, {
    endpoint: '/account',
    method: 'get',
    requireAuth: true,
    handler: async ({ jwt }) => {
      const { account_id } = jwt

      const {
        accounts,
        attendees,
        badges,
        purchases,
        cabins,
        festivals,
      } = await withDBTransaction((db) =>
        allPromises({
          accounts: db.queryTable('account', {
            where: ['account_id', '=', account_id],
          }),
          attendees: db.queryTable('attendee', {
            where: ['associated_account_id', '=', account_id],
          }),
          badges: db.queryObject<Tables['badge_info']>`
            select badge_info.* from badge_info
            left join attendee on attendee.attendee_id = badge_info.attendee_id
            where attendee.associated_account_id = ${account_id}
          `,
          purchases: db.queryTable('purchase', {
            where: ['owned_by_account_id', '=', account_id],
          }),
          cabins: db.queryObject<{
            cabin_name: Tables['cabin']['name']
            attendee_id: Tables['attendee']['attendee_id']
            festival_id: Tables['festival']['festival_id']
          }>`
            select cabin.name as cabin_name, attendee.attendee_id, festival.festival_id 
            from attendee
            left join attendee_cabin on attendee.attendee_id = attendee_cabin.attendee_id
            left join cabin on attendee_cabin.cabin_id = cabin.cabin_id
            left join festival_site on cabin.festival_site_id = festival_site.festival_site_id
            left join festival on festival.festival_site_id = festival_site.festival_site_id
            where attendee_cabin.cabin_id is not null and attendee.associated_account_id = ${account_id}
          `,
          festivals: db.queryTable('festival'),
        })
      )

      const account = accounts[0]

      if (account != null) {
        const applicationStatus = await getApplicationStatus(account)

        // @ts-ignore
        const now = dayjs.utc()
        const filteredCabins = cabins.rows.filter(cabin => {
          const festival = festivals.find(f => f.festival_id === cabin.festival_id)
          return festival != null && shouldShowCabinsForFestival(
            now,
            // @ts-ignore
            dayjs.utc(stringifyDate(festival.start_date)),
            account.is_team_member
          )
        })

        return [
          {
            account_id: account.account_id,
            email_address: account.email_address,
            application_status: applicationStatus,
            is_team_member: account.is_team_member,
            is_low_income: account.is_low_income,
            attendees: attendees.map(({ notes: _, ...attendee }) => attendee)
              .toSorted((a) => a.is_primary_for_account ? -1 : 0),
            badges: badges.rows,
            purchases,
            cabins: filteredCabins,
          },
          Status.OK,
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
    handler: async (
      { jwt: { account_id }, body: { email_address: raw_email_address } },
    ) => {
      const email_address = raw_email_address.toLowerCase()

      await withDBConnection((db) =>
        db.updateTable('account', { email_address }, [
          ['account_id', '=', account_id],
        ])
      )

      return [null, Status.OK]
    },
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
        password,
      )

      await withDBConnection((db) =>
        db.updateTable('account', { password_hash, password_salt }, [
          ['account_id', '=', account_id],
        ])
      )

      return [null, Status.OK]
    },
  })

  const passwordResetSecrets = new Map<
    string,
    Tables['account']['account_id']
  >()

  defineRoute(router, {
    endpoint: '/account/send-password-reset-email',
    method: 'post',
    requireAuth: false,
    handler: rateLimited(500, async ({ body: { email_address: raw_email_address } }) => {
      const email_address = raw_email_address.toLowerCase()
      const accountRes = await withDBConnection((db) =>
        db.queryTable('account', {
          where: ['email_address', '=', email_address],
        })
      )
      const account = accountRes[0]

      if (account) {
        const secret = crypto.randomUUID()
        passwordResetSecrets.set(secret, account.account_id)
        const email = passwordResetEmail(account, secret)
        await sendMail(email)
        return [null, Status.OK]
      }

      return [null, Status.BadRequest]
    }),
  })

  defineRoute(router, {
    endpoint: '/account/reset-password',
    method: 'put',
    requireAuth: false,
    handler: async ({ body: { password, secret } }) => {
      const account_id = passwordResetSecrets.get(secret)

      if (account_id) {
        passwordResetSecrets.delete(secret)

        if (getPasswordValidationError(password)) {
          return [{ jwt: null }, Status.BadRequest]
        }

        const { password_hash, password_salt } = await hashAndSaltPassword(
          password,
        )

        const accountRes = await withDBConnection((db) =>
          db.updateTable('account', { password_hash, password_salt }, [
            ['account_id', '=', account_id],
          ])
        )

        const account = accountRes[0]!

        return [{ jwt: await createAccountJwt(account) }, Status.OK]
      } else {
        return [{ jwt: null }, Status.InternalServerError]
      }
    },
  })

  defineRoute(router, {
    endpoint: '/account/update-attendee',
    method: 'put',
    requireAuth: true,
    handler: async (
      { jwt: { account_id }, body: { attendee_id, ...attendeeUpdate } },
    ) => {
      if (attendee_id == null) {
        return [null, Status.InternalServerError]
      }

      const attendee = await withDBConnection(async (db) =>
        (await db.updateTable('attendee', attendeeUpdate, [
          ['associated_account_id', '=', account_id],
          ['attendee_id', '=', attendee_id],
        ]))[0]
      )

      if (attendee == null) {
        return [null, Status.InternalServerError]
      }

      return [attendee, Status.OK]
    },
  })

  defineRoute(router, {
    endpoint: '/account/save-attendees',
    method: 'put',
    requireAuth: true,
    handler: async ({ jwt: { account_id }, body: { attendees } }) => {
      return await withDBConnection(async db => {
        for (const { attendee_id, ...attendee } of attendees) {
          if (attendee_id) {
            const updated = await db.updateTable('attendee', attendee, [
              ['associated_account_id', '=', account_id],
              ['attendee_id', '=', attendee_id],
            ])

            if (updated.length === 0) {
              console.error(`ERROR: Tried to update attendee ${attendee_id} under account ${account_id}, but it couldn't be found`)
            }
          } else {
            await db.insertTable('attendee', {
              ...attendee,
              associated_account_id: account_id,
            })
          }
        }

        return [null, Status.OK]
      })
    }
  })

  defineRoute(router, {
    endpoint: '/account/submit-invite-code',
    method: 'post',
    requireAuth: true,
    handler: rateLimited(
      ONE_SECOND_MS,
      async ({ jwt, body: { invite_code } }) => {
        const { account_id } = jwt

        // we do our own check because postgres will throw an error on a
        // malformed uuid, causing a 500 response
        if (getUuidValidationError(invite_code) != null) {
          // invite code doesn't exist
          console.error(`Invalid invite code submitted: "${invite_code}"`)
          return [null, Status.NotFound]
        }

        return await withDBTransaction(async (db) => {
          const inviteCodeResult = (await db.queryTable('invite_code', {
            where: ['code', '=', invite_code],
          }))[0]

          if (inviteCodeResult == null) {
            // invite code doesn't exist
            console.error(`Invalid invite code submitted: "${invite_code}"`)
            return [null, Status.NotFound]
          }

          if (inviteCodeResult.used_by_account_id != null) {
            // invite code already used
            console.error(
              `Already-used invite code submitted: "${invite_code}"`,
            )
            return [null, Status.Forbidden]
          }

          const accountResult = await db.queryTable('account', {
            where: ['account_id', '=', account_id],
          })
          const currentAccount = accountResult[0]
          if (currentAccount == null) {
            // account doesn't exist
            throw Error(
              `Tried to submit invite code from account that doesn't exist: "${account_id}"`,
            )
          }

          const codeUsedByCurrentAccount = (await db.queryTable('invite_code', {
            where: ['used_by_account_id', '=', account_id],
          }))[0]
          if (codeUsedByCurrentAccount != null) {
            // this account already used an invite code
            throw Error(
              `Account tried to submit an invite code but has already used one: "${account_id}"`,
            )
          }

          await db.updateTable('invite_code', {
            used_by_account_id: account_id,
          }, [['code', '=', invite_code]])

          return [null, Status.OK]
        })
      },
    ),
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

      return await withDBConnection(async (db) => {
        const account = (await db.queryTable('account', {
          where: ['account_id', '=', account_id],
        }))[0]!

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

        await db.updateTable('account', { application_id }, [[
          'account_id',
          '=',
          account_id,
        ]])

        return [null, Status.OK]
      })
    },
  })

  defineRoute(router, {
    endpoint: '/account/update-badge-info',
    method: 'put',
    requireAuth: true,
    handler: async (
      { jwt: { account_id }, body: badgeInfo },
    ) => {
      return await withDBConnection(async (db) => {
        const attendee = (await db.queryTable('attendee', {
          where: ['attendee_id', '=', badgeInfo.attendee_id],
        }))[0]

        // verify that the authenticated account is allowed to modify this attendee's info
        if (attendee?.associated_account_id !== account_id) {
          return [null, Status.Unauthorized]
        }

        const existingBadge = (await db.queryTable('badge_info', {
          where: ['attendee_id', '=', badgeInfo.attendee_id],
        })).find((badge) => badge.festival_id === badgeInfo.festival_id)

        if (existingBadge) {
          await db.updateTable('badge_info', badgeInfo, [
            ['attendee_id', '=', badgeInfo.attendee_id],
            ['festival_id', '=', badgeInfo.festival_id],
          ])
        } else {
          await db.insertTable('badge_info', badgeInfo)
        }

        return [null, Status.OK]
      })
    },
  })
}
