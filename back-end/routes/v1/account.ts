import { Router, Status } from "oak";
import { defineRoute } from "./_common.ts";
import { db } from "../../db.ts";
import { FullAccountInfo } from "https://raw.githubusercontent.com/vibecamp/vibecamp-web/main/common/data.ts";

export default function register(router: Router) {
    const baseRoute = '/account'

    // purchase one or multiple tickets, fill out baseline required attendee info
    defineRoute<FullAccountInfo | null>(router, {
        endpoint: baseRoute,
        method: 'get',
        requireAuth: true,
        handler: async (_ctx, jwt) => {
            const { account_id } = jwt

            const rows = await db
                .selectFrom('account')
                .leftJoin('account_attendee', 'account.account_id', 'account_attendee.account_id')
                .leftJoin('attendee', 'account_attendee.attendee_id', 'attendee.attendee_id')
                .leftJoin('ticket', 'attendee.ticket_id', 'ticket.ticket_id')
                .where('account.account_id', '=', account_id)
                .selectAll()
                .execute()

            const firstRow = rows[0]
            if (firstRow != null) {
                const { account_id, email_address } = firstRow
                const attendees = new Map<number, FullAccountInfo['attendees'][number]>()

                for (const row of rows) {
                    const attendee_id = row.attendee_id as number

                    if (!attendees.has(attendee_id)) {
                        const {
                            name,
                            is_child,
                            dietary_restrictions,
                            has_purchased_bedding,
                            has_purchased_bus_ticket,
                            is_default_for_account,
                            ticket_id,
                            event_id
                        } = row

                        attendees.set(attendee_id, {
                            attendee_id,
                            name,
                            is_child,
                            dietary_restrictions,
                            has_purchased_bedding,
                            has_purchased_bus_ticket,
                            is_default_for_account,
                            ticket: {
                                ticket_id,
                                event_id
                            }
                        })
                    }
                }

                return [{
                    account_id,
                    email_address,
                    attendees: Array.from(attendees.values())
                }, Status.OK]
            }

            return [null, Status.NotFound]
        }
    })
}