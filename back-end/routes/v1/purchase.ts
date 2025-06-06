import { Router, Status } from 'oak'
import { defineRoute } from './_common.ts'
import { stripe, usingStripeTestKey } from '../../utils/stripe.ts'
import { withDBConnection, withDBTransaction } from '../../utils/db.ts'
import {
  exists,
  getDiscountsFromCode,
  objectEntries,
  objectFromEntries,
  purchaseBreakdown,
  purchaseTypeAvailable,
  totalCost,
} from '../../utils/misc.ts'
import { Tables } from '../../types/db-types.ts'
import { Purchases } from '../../types/route-types.ts'
import { receiptEmail, sendMail } from '../../utils/mailgun.ts'
import env from '../../env.ts'

export default function register(router: Router) {
  defineRoute(router, {
    endpoint: '/purchase/availability',
    method: 'get',
    requireAuth: true,
    handler: async ({ jwt: { account_id } }) => {
      return [await purchaseTypeAvailability(account_id), Status.OK]
    },
  })

  defineRoute(router, {
    endpoint: '/discounts-by-code',
    method: 'post',
    requireAuth: true,
    handler: async ({ body: { discount_code } }) => {
      if (discount_code === '') {
        return [[], Status.OK]
      }

      const allDiscounts = await withDBConnection((db) =>
        db.queryTable('discount')
      )
      return [getDiscountsFromCode(allDiscounts, discount_code), Status.OK]
    },
  })

  defineRoute(router, {
    endpoint: '/purchase/create-intent',
    method: 'post',
    requireAuth: true,
    handler: async (
      {
        jwt: { account_id },
        body: { purchases, discount_code, referral_info },
      },
    ) => {
      const availability = await purchaseTypeAvailability(account_id)

      for (
        const [purchaseTypeId, numberToPurchase] of objectEntries(purchases)
      ) {
        const current = availability.find((p) =>
          p.purchaseType.purchase_type_id === purchaseTypeId
        )
        if (current == null) {
          throw Error(
            `Can't create purchase intent with invalid purchase type: ${purchaseTypeId}`,
          )
        }

        // if purchase type isn't available, don't allow purchase
        if (current.available < numberToPurchase!) {
          return [null, Status.Unauthorized]
        }
      }

      const allDiscounts = await withDBConnection((db) =>
        db.queryTable('discount')
      )
      const discounts = discount_code != null
        ? getDiscountsFromCode(allDiscounts, discount_code)
        : []

      const sanitizedPurchases = objectFromEntries(
        objectEntries(purchases).map(
          ([purchaseType, count]) => {
            const nonNullCount = count ?? 0
            const nonNegativeCount = Math.max(nonNullCount, 0)
            const integerCount = Math.floor(nonNegativeCount)
            return [purchaseType, integerCount]
          },
        ),
      )

      const purchaseInfo = purchaseBreakdown(
        sanitizedPurchases,
        discounts,
        availability.map((a) => a.purchaseType),
      )
      const amount = totalCost(purchaseInfo)

      const metadata: PurchaseMetadata = {
        createdByMyVibeCamp: 'true',
        accountId: account_id,
        discount_ids: discounts.map((d) => d.discount_id).join(','),
        referral_info: referral_info?.substring(0, 500),
        ...objectFromEntries(
          objectEntries(sanitizedPurchases).map((
            [key, value],
          ) => [key, String(value)]),
        ),
      }

      const { client_secret } = await stripe.paymentIntents.create({
        amount,
        currency: 'usd',
        automatic_payment_methods: {
          enabled: true,
        },
        metadata,
      })

      if (client_secret == null) {
        return [null, Status.InternalServerError]
      }

      return [{ stripe_client_secret: client_secret }, Status.OK]
    },
  })

  type PurchaseMetadata =
    & {
      createdByMyVibeCamp?: 'true'
      accountId: Tables['account']['account_id']
      discount_ids?: string
      referral_info?: string
    }
    & Record<Tables['purchase_type']['purchase_type_id'], string> // stripe converts numbers to strings for some reason

  router.post('/purchase/record', async (ctx) => {
    const rawBody = await ctx.request.body({ type: 'bytes' }).value
    const event = await stripe.webhooks.constructEventAsync(
      rawBody,
      ctx.request.headers.get('stripe-signature'),
      env.STRIPE_SIGNING_SECRET,
    )

    switch (event.type) {
      case 'charge.succeeded':
        {
          console.info(`\tHandled Stripe event type ${event.type}`)

          const { createdByMyVibeCamp, accountId, discount_ids: discount_ids_raw, ...purchasesRaw } = event.data.object
            .metadata as PurchaseMetadata
          const discountIds = (discount_ids_raw?.split(',') ?? []) as Tables['discount']['discount_id'][]

          if (!createdByMyVibeCamp) {
            throw Error(
              'Ignoring payment event that wasn\'t created by the my.vibe.camp front-end'
            )
          }

          const purchases: Purchases = objectFromEntries(
            objectEntries(purchasesRaw)
              .map(([key, value]) => [key, Number(value)]),
          ) // convert counts back to numbers

          const stripe_payment_intent =
            typeof event.data.object.payment_intent === 'object'
              ? event.data.object.payment_intent?.id
              : event.data.object.payment_intent

          await withDBTransaction(async (db) => {
            const allDiscounts = await db.queryTable('discount')
            const appliedDiscounts = discountIds.map(id => allDiscounts.find(d => d.discount_id === id)).filter(exists)

            for (const [purchaseType, count] of objectEntries(purchases)) {
              for (let i = 0; i < count!; i++) {
                await db.insertTable('purchase', {
                  owned_by_account_id: accountId,
                  purchase_type_id: purchaseType,
                  stripe_payment_intent,
                  is_test_purchase: usingStripeTestKey,
                  applied_discount: appliedDiscounts.find(d => d?.purchase_type_id === purchaseType)?.discount_id
                })
              }
            }

            const account = (await db.queryTable('account', {
              where: ['account_id', '=', accountId],
            }))[0]!

            await sendMail(
              await receiptEmail(account, purchases, appliedDiscounts),
            )
          })

          ctx.response.status = Status.OK
        }
        break
      default: {
        console.warn(`\tUnhandled Stripe event type ${event.type}`)
        ctx.response.status = Status.BadRequest
      }
    }
  })

  router.get('/purchase/check-in/:purchase_id', async (ctx) => {
    const purchase_id = ctx.params
      .purchase_id as Tables['purchase']['purchase_id']

    ctx.response.type = 'html'

    await withDBConnection(async (db) => {
      try {
        const purchase = (await db.queryTable('purchase', {
          where: ['purchase_id', '=', purchase_id],
        }))[0]

        if (purchase == null) {
          ctx.response.status = Status.BadRequest
          ctx.response.body = messageHtml(
            'error',
            "Invalid check-in link: this purchase ID doesn't exist!",
          )
        } else if (purchase.checked_in) {
          ctx.response.status = Status.BadRequest
          ctx.response.body = messageHtml(
            'warning',
            'This purchase has been checked in already',
          )
        } else {
          await db.updateTable('purchase', { checked_in: true }, [[
            'purchase_id',
            '=',
            purchase_id,
          ]])
          ctx.response.status = Status.OK
          ctx.response.body = messageHtml('success', 'Checked in successfully!')
        }
      } catch {
        ctx.response.status = Status.BadRequest
        ctx.response.body = messageHtml(
          'error',
          'Invalid check-in link: broken URL',
        )
      }
    })
  })

  defineRoute(router, {
    endpoint: '/purchase/selflathing/status',
    method: 'post',
    requireAuth: false,
    handler: async ({ body: { secret_key, festival_id, attendees } }) => {
      if (secret_key !== env.SELF_LATHING_SECRET_KEY) {
        return [null, Status.Unauthorized]
      }

      const cleanedAttendees = attendees.map((a) => a.replace(/^@/, ''))

      return await withDBConnection(async (db) => {
        const status: Record<string, boolean> = {}

        for (const attendee of cleanedAttendees) {
          const attendeePattern = `%${attendee}%`

          const { count } = (await db.queryObject<{ count: bigint }>`
            select count(attendee.attendee_id)
            from purchase
              left join purchase_type on purchase_type.purchase_type_id = purchase.purchase_type_id
              left join attendee on purchase.owned_by_account_id = attendee.associated_account_id
            where
              purchase_type.is_attendance_ticket = true and
              festival_id = ${festival_id} and
              share_ticket_status_with_selflathing = true and
            (
              attendee.name ilike ${attendeePattern} or
              attendee.twitter_handle ilike ${attendeePattern} or
              attendee.discord_handle ilike ${attendeePattern}
            )
          `).rows[0]!

          status[attendee] = Number(count) > 0
        }

        return [status, Status.OK]
      })
    },
  })
}

const messageHtml = (
  icon: 'success' | 'warning' | 'error',
  message: string,
) => {
  const iconChar = icon === 'success' ? '✅︎' : icon === 'warning' ? '⚠' : '❌'

  return (
    `
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body>
        <style>
          body {
            font-family: sans-serif;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            font-size: 32px;
            text-align: center;
            gap: 1em;
            padding: 20px;
          }
        </style>
        <div>
          ${iconChar}
        </div>
        <div>
          ${message}
        </div>
      </body>
    `
  )
}

async function purchaseTypeAvailability(
  account_id: Tables['account']['account_id'],
) {
  const {
    account,
    accountPurchaseCounts,
    allPurchaseCounts,
    allPurchaseTypes,
    festivals,
  } = await withDBConnection(async (db) => ({
    account: (await db.queryTable('account', {
      where: ['account_id', '=', account_id],
    }))[0],
    accountPurchaseCounts: (await db.queryObject<
      {
        purchase_type_id: Tables['purchase_type']['purchase_type_id']
        count: bigint
      }
    >`
      SELECT purchase.purchase_type_id, COUNT(*)
      FROM purchase, purchase_type
      WHERE purchase_type.purchase_type_id = purchase.purchase_type_id
        AND purchase.owned_by_account_id = ${account_id}
      GROUP BY purchase.purchase_type_id
    `).rows.map((row) => ({
      ...row,
      // `count` comes back from the client as a BigInt, which causes problems if not converted
      count: Number(row.count),
    })),
    allPurchaseCounts: (await db.queryObject<
      {
        purchase_type_id: Tables['purchase_type']['purchase_type_id']
        count: bigint
      }
    >`
      SELECT purchase_type_id, COUNT(purchase_type_id)
      FROM purchase
      GROUP BY purchase_type_id
    `).rows.map((row) => ({
      ...row,
      count: Number(row.count),
    })),
    allPurchaseTypes: await db.queryTable('purchase_type'),
    festivals: await db.queryTable('festival'),
  }))

  return allPurchaseTypes.map((purchaseType) => {
    if (account == null) {
      return { purchaseType, available: 0 }
    } else {
      const { purchase_type_id, max_available, max_per_account, festival_id } =
        purchaseType
      const festival = festivals.find((f) => f.festival_id === festival_id)!

      // start with no limit
      let available = Number.MAX_SAFE_INTEGER

      // if purchase type isn't available currently, don't allow purchases
      if (!purchaseTypeAvailable(purchaseType, account, festival)) {
        available = 0
      }

      // cap by max purchases available of this type across the board
      const allPurchased = allPurchaseCounts.find((c) =>
        c.purchase_type_id === purchase_type_id
      )?.count ?? 0
      if (max_available != null) {
        available = Math.min(available, max_available - allPurchased)
      }

      // cap by max purchases available of this type per-account
      if (max_per_account != null) {
        const alreadyPurchasedCount = accountPurchaseCounts.find((p) =>
          p.purchase_type_id === purchase_type_id
        )?.count ?? 0
        available = Math.min(available, max_per_account - alreadyPurchasedCount)
      }

      // if we went negative, bump up to 0
      available = Math.max(available, 0)

      return { purchaseType, available }
    }
  })
}
