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
    handler: async ({ jwt: { account_id }, body: { adult_tickets_to_purchase, child_tickets_to_purchase } }) => {
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

      if (typeof adult_tickets_to_purchase !== 'number' || typeof child_tickets_to_purchase !== 'number') {
        return [null, Status.BadRequest]
      }

      if (allowedToPurchaseTickets - adultTicketsAlreadyPurchased < adult_tickets_to_purchase) {
        return [null, Status.Unauthorized]
      }

      const amount = (
        adult_tickets_to_purchase * ADULT_TICKET_PRICE +
        child_tickets_to_purchase * CHILD_TICKET_PRICE
      )

      // Create a PaymentIntent with the order amount and currency
      const { client_secret } = await stripe.paymentIntents.create({
        amount,
        currency: 'usd',
        // In the latest version of the API, specifying the `automatic_payment_methods` parameter is optional because Stripe enables its functionality by default.
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
}
