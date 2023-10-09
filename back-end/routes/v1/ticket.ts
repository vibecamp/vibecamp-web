import { Router, Status } from 'oak'
import { defineRoute } from './_common.ts'
import { stripe } from '../../stripe.ts'
import {
  accountReferralStatus,
  fullAccountInfo,
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
      })

      if (client_secret == null) {
        return [null, Status.InternalServerError]
      }

      return [{ stripeClientSecret: client_secret }, Status.OK]
    },
  })

  router.post(baseRoute + '/record-purchase', ctx => {
    console.log('/record-purchase')
    const event = stripe.webhooks.constructEvent(ctx.request.body({ type: 'bytes' }), ctx.request.headers.get('stripe-signature'), '')
    console.log(event)
    switch (event.type) {
      case 'checkout.session.completed':
        console.log('checkout.session.completed', event.data.object)
        // Then define and call a function to handle the event checkout.session.completed
        break;
      default:
        console.log(`Unhandled event type ${event.type}`);
    }
  })
}
