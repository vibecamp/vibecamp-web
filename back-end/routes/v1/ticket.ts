import { Router, Status } from 'oak'
import { defineRoute } from './_common.ts'
import { stripe } from '../../stripe.ts'
import {
  accountReferralStatus,
  withDBConnection,
  withDBTransaction,
} from '../../db.ts'
import { allPromises } from '../../utils.ts'
import { MAX_TICKETS_PER_ACCOUNT } from '../../common/constants.ts'
import { Tables } from "../../db-types.ts"
import { _format } from 'https://deno.land/std@0.152.0/path/_util.ts'

export default function register(router: Router) {

  // purchase one or multiple tickets, fill out baseline required attendee info
  defineRoute(router, {
    endpoint: '/ticket/create-purchase-intent',
    method: 'post',
    requireAuth: true,
    handler: async ({ jwt: { account_id }, body: { adult_tickets, child_tickets, bus_tickets, bedding_tickets } }) => {
      const nextFestival = await withDBConnection(async db =>
        (await db.queryObject<{ festival_id: number }>`SELECT * FROM next_festival`).rows[0])

      if (nextFestival == null) {
        console.error('Failed to find next_festival in the database!')
        return [null, Status.InternalServerError]
      }

      const {
        referralStatus: { allowedToPurchaseTickets },
        attendees,
      } = await withDBTransaction(db =>
        allPromises({
          referralStatus: accountReferralStatus(db, account_id, nextFestival.festival_id),
          attendees: db.queryObject<Tables['attendee'] & Tables['age_group']>`
            SELECT * FROM attendee, age_group
            WHERE associated_account_id = ${account_id}
            AND age_group.age_group = attendee.age_group
          `,
        })
      )

      const adultTicketsAlreadyPurchased = attendees.rows.filter(a => !a.is_child).length
      const childTicketsAlreadyPurchased = attendees.rows.filter(a => a.is_child).length

      if (
        !allowedToPurchaseTickets ||
        adultTicketsAlreadyPurchased + adult_tickets >= MAX_TICKETS_PER_ACCOUNT.adult ||
        childTicketsAlreadyPurchased + child_tickets >= MAX_TICKETS_PER_ACCOUNT.child

      ) {
        return [null, Status.Unauthorized]
      }

      // TODO: Grab prices from DB
      const amount = (
        adult_tickets * 550_00 +
        child_tickets * 550_00
      )

      const metadata: PurchaseMetadata = {
        account_id,
        adult_tickets,
        child_tickets,
        bus_tickets,
        bedding_tickets
      }

      // Create a PaymentIntent with the order amount and currency
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

  type PurchaseMetadata = {
    account_id: number,
    adult_tickets: number,
    child_tickets: number,
    bus_tickets: number,
    bedding_tickets: number
  }

  router.post('/ticket/record-purchase', async ctx => {
    const rawBody = await ctx.request.body({ type: 'bytes' }).value
    const event = await stripe.webhooks.constructEventAsync(
      rawBody,
      ctx.request.headers.get('stripe-signature'),
      'whsec_accf21614aa842e5fc86edbcb06352e28cdd2c9d04c429a100f4ac52dee77e19'
    )

    // TODO: check that there are still tickets available for this festival

    switch (event.type) {
      case 'charge.succeeded': {
        // @ts-expect-error Missing types on event.data.object
        const metadata: Record<keyof PurchaseMetadata, string> = event.data.object.metadata

        const { account_id: accountIdStr, adult_tickets: adultTicketsStr, child_tickets: childTicketsStr } = metadata
        const accountId = Number(accountIdStr)
        const adultTickets = Number(adultTicketsStr)
        const childTickets = Number(childTicketsStr)

        return await withDBTransaction(async (db) => {
          const festival_id = (await db.queryObject<Tables['festival']>`select * from next_festival`).rows[0]?.festival_id

          const tickets = new Array(adultTickets).fill('adult').concat(new Array(childTickets).fill('child')) as Array<'adult' | 'child'>

          for (const ticketKind of tickets) {
            const isChild = ticketKind === 'child'

            const attendee_id = (await db.queryObject<Pick<Tables['attendee'], 'attendee_id'>>`
              INSERT INTO attendee (is_child, associated_account_id)
              VALUES (${isChild}, ${accountId})
              RETURNING attendee_id
            `).rows[0]?.attendee_id

            await db.queryObject`
              INSERT INTO ticket (festival_id, owned_by_account_id, assigned_to_attendee_id, ticket_type)
              VALUES (${festival_id}, ${accountId}, ${attendee_id}, ${isChild ? 'ATTENDANCE_CHILD_CABIN' : 'ATTENDANCE_ADULT_CABIN'})
            `
          }
        })
      }
      default:
        console.warn(`Unhandled Stripe event type ${event.type}`);
    }
  })
}
