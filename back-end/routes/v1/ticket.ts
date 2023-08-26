import { Router, Status } from "oak";
import { defineRoute } from "./_common.ts";

export default function register(router: Router) {
    const baseRoute = '/ticket'

    // purchase one or multiple tickets, fill out baseline required attendee info
    defineRoute<null>(router, {
        endpoint: baseRoute + '/purchase',
        method: 'post',
        requireAuth: true,
        handler: async (_ctx, jwt) => {
            if (!jwt.user.allowed_to_buy_tickets) {
                return [null, Status.Unauthorized]
            }



            return [null, Status.OK]
        }
    })

}