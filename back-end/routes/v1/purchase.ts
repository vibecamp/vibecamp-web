import { Router, Status } from 'oak'
import { defineRoute } from './_common.ts'
import { stripe } from '../../stripe.ts'
import {
  accountReferralStatus,
  withDBConnection,
  withDBTransaction,
} from '../../db.ts'
import { objectEntries, objectFromEntries } from '../../utils.ts'
import { TABLE_ROWS, Tables } from "../../db-types.ts"
import { _format } from 'https://deno.land/std@0.152.0/path/_util.ts'
import { Purchases } from '../../common/route-types.ts'

const PURCHASE_TYPES_BY_TYPE = objectFromEntries(
  TABLE_ROWS.purchase_type.map(r => [r.purchase_type_id, r])
)

export default function register(router: Router) {

  defineRoute(router, {
    endpoint: '/purchase/create-intent',
    method: 'post',
    requireAuth: true,
    handler: async ({ jwt: { account_id }, body: purchases }) => {
      const nextFestival = await withDBConnection(async db =>
        (await db.queryTable('next_festival'))[0])

      if (nextFestival == null) {
        console.error('Failed to find next_festival in the database!')
        return [null, Status.InternalServerError]
      }

      const { allowedToPurchase } = await withDBConnection(db => accountReferralStatus(db, account_id, nextFestival.festival_id))
      if (!allowedToPurchase) {
        return [null, Status.Unauthorized]
      }

      const alreadyPurchased = await withDBConnection(async db =>
        (await db.queryObject<{ purchase_type_id: Tables['purchase_type']['purchase_type_id'], count: number }>`
          SELECT purchase.purchase_type_id, COUNT(*)
          FROM purchase, purchase_type
          WHERE purchase_type.purchase_type_id = purchase.purchase_type_id AND purchase.owned_by_account_id = ${account_id}
          group by purchase.purchase_type_id
        `).rows)

      for (const [purchaseType, toPurchaseCount] of objectEntries(purchases)) {
        const { festival_id, max_available, max_per_account } = PURCHASE_TYPES_BY_TYPE[purchaseType]

        // TODO: check max_available against total purchased across all accounts

        if (festival_id !== nextFestival.festival_id) {
          return [null, Status.Unauthorized]
        }

        const alreadyPurchasedCount = alreadyPurchased.find(p => p.purchase_type_id === purchaseType)?.count ?? 0

        if (max_per_account != null && alreadyPurchasedCount + toPurchaseCount > max_per_account) {
          return [null, Status.Unauthorized]
        }
      }

      const amount = objectEntries(purchases)
        .map(([purchaseType, count]) =>
          PURCHASE_TYPES_BY_TYPE[purchaseType].price_in_cents * count)
        .reduce((sum, amount) => sum + amount, 0)

      const metadata: PurchaseMetadata = {
        accountId: String(account_id),
        ...objectFromEntries(objectEntries(purchases).map(([key, value]) => [key, String(value)]))
      }

      const { client_secret } = await stripe.paymentIntents.create({
        amount,
        currency: 'usd',
        automatic_payment_methods: {
          enabled: true,
        },
        metadata
      })

      if (client_secret == null) {
        return [null, Status.InternalServerError]
      }

      return [{ stripe_client_secret: client_secret }, Status.OK]
    },
  })

  type PurchaseMetadata =
    & { accountId: string }
    & Record<(typeof TABLE_ROWS)['purchase_type'][number]['purchase_type_id'], string> // stripe converts numbers to strings for some reason

  router.post('/purchase/record', async ctx => {
    const rawBody = await ctx.request.body({ type: 'bytes' }).value
    const event = await stripe.webhooks.constructEventAsync(
      rawBody,
      ctx.request.headers.get('stripe-signature'),
      'whsec_accf21614aa842e5fc86edbcb06352e28cdd2c9d04c429a100f4ac52dee77e19'
    )

    switch (event.type) {
      case 'charge.succeeded': {
        // @ts-expect-error Missing types on event.data.object
        const { metadata } = event.data.object

        const { accountId: accountIdRaw, ...purchasesRaw }: PurchaseMetadata = metadata
        const accountId = Number(accountIdRaw)

        const purchases: Purchases = objectFromEntries(objectEntries(purchasesRaw)
          .map(([key, value]) => [key, Number(value)])) // convert counts back to numbers

        return await withDBTransaction(async (db) => {
          const festival_id = (await db.queryTable('next_festival'))[0]?.festival_id

          for (const [purchaseType, count] of objectEntries(purchases)) {
            for (let i = 0; i < count; i++) {
              await db.insertTable('purchase', {
                festival_id,
                owned_by_account_id: accountId,
                // assigned_to_attendee_id: 
                purchase_type_id: purchaseType
              })
            }
          }
        })
      }
      default:
        console.warn(`Unhandled Stripe event type ${event.type}`);
    }
  })
}
