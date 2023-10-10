import { Router, Status } from 'oak'
import { defineRoute } from './_common.ts'
import { stripe } from '../../stripe.ts'
import {
  accountReferralStatus,
  fullAccountInfo,
  purchaseTickets,
  withDBConnection,
} from '../../db.ts'
import { allPromises } from '../../utils.ts'
import { ADULT_TICKET_PRICE, CHILD_TICKET_PRICE } from '../../common/constants.ts'

export default function register(router: Router) {
  const baseRoute: `/${string}` = '/ticket'

  // purchase one or multiple tickets, fill out baseline required attendee info
  defineRoute<{ stripeClientSecret: string }>(router, {
    endpoint: baseRoute + '/create-purchase-intent',
    method: 'post',
    requireAuth: true,
    handler: async ({ jwt: { account_id }, body: { adultTickets, childTickets } }) => {
      const {
        referralStatus: { allowedToPurchaseTickets },
        accountInfo,
      } = await allPromises({
        referralStatus: withDBConnection(db =>
          accountReferralStatus(db, account_id)
        ),
        accountInfo: fullAccountInfo(account_id),
      })

      const adultTicketsAlreadyPurchased = accountInfo?.attendees.filter(a => !a.is_child).length

      if (
        adultTicketsAlreadyPurchased == null ||
        adultTicketsAlreadyPurchased >= allowedToPurchaseTickets
      ) {
        return [null, Status.Unauthorized]
      }

      if (typeof adultTickets !== 'number' || typeof childTickets !== 'number') {
        return [null, Status.BadRequest]
      }

      if (allowedToPurchaseTickets - adultTicketsAlreadyPurchased < adultTickets) {
        return [null, Status.Unauthorized]
      }

      const amount = (
        adultTickets * ADULT_TICKET_PRICE +
        childTickets * CHILD_TICKET_PRICE
      )

      // Create a PaymentIntent with the order amount and currency
      const { client_secret } = await stripe.paymentIntents.create({
        amount,
        currency: 'usd',
        automatic_payment_methods: {
          enabled: true,
        },
        metadata: {
          account_id,
          adultTickets,
          childTickets
        }
      })

      if (client_secret == null) {
        return [null, Status.InternalServerError]
      }

      return [{ stripeClientSecret: client_secret }, Status.OK]
    },
  })

  router.post(baseRoute + '/record-purchase', async ctx => {
    const rawBody = await ctx.request.body({ type: 'bytes' }).value
    const event = await stripe.webhooks.constructEventAsync(
      rawBody,
      ctx.request.headers.get('stripe-signature'),
      'whsec_accf21614aa842e5fc86edbcb06352e28cdd2c9d04c429a100f4ac52dee77e19'
    )

    // TODO: check that there are still tickets available for this festival

    switch (event.type) {
      case 'checkout.session.completed': {
        // @ts-expect-error Missing types on event.data.object
        const { account_id: account_id_str, adultTickets: adultTicketsStr, childTickets: childTicketsStr } = event.data.object.metadata
        const account_id = Number(account_id_str)
        const adultTickets = Number(adultTicketsStr)
        const childTickets = Number(childTicketsStr)

        purchaseTickets({ account_id, adultTickets, childTickets })
      } break;
      default:
        console.log(`Unhandled event type ${event.type}`);
    }
  })
}
