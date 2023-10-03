import { Router, Status } from "oak";
import { defineRoute } from "./_common.ts";
import { stripe } from "../../stripe.ts";
import env from "../../env.ts";
import { accountReferralStatus, fullAccountInfo, withDBConnection } from "../../db.ts";
import { allPromises } from "../../utils.ts";

export default function register(router: Router) {
    const baseRoute = '/ticket'

    // purchase one or multiple tickets, fill out baseline required attendee info
    defineRoute<null>(router, {
        endpoint: baseRoute + '/purchase',
        method: 'post',
        requireAuth: true,
        handler: async ({ jwt }) => {
            const {
                referralStatus: { allowedToPurchaseTickets },
                accountInfo
            } = await allPromises({
                referralStatus: withDBConnection(db => accountReferralStatus(db, jwt.account_id)),
                accountInfo: fullAccountInfo(jwt.account_id)
            })

            if (accountInfo == null || accountInfo.attendees.filter(a => !a.is_child).length >= allowedToPurchaseTickets) {
                return [null, Status.Unauthorized]
            }

            const paymentIntent = await stripe.paymentIntents.create({
                amount: 123_00,
                currency: "usd",
            })

            // res.send({
            //     clientSecret: paymentIntent.client_secret,
            // })

            return [null, Status.OK]
        }
    })

}
