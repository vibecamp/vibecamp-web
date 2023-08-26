import { Router, Status } from "oak";
import { defineRoute } from "./_common.ts";
import { db } from "../../db.ts";
import { Account } from "../../db.d.ts";

export default function register(router: Router) {
    const baseRoute = '/account'

    // purchase one or multiple tickets, fill out baseline required attendee info
    defineRoute<Account | null>(router, {
        endpoint: baseRoute,
        method: 'get',
        requireAuth: true,
        handler: async (_ctx, jwt) => {
            const { account_id } = jwt

            const account = await db.selectFrom('account').where('account_id', '=', account_id).selectAll().executeTakeFirst()

            return [account ?? null, Status.OK]
        }
    })

}
