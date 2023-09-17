import { Router, Status } from "oak";
import { defineRoute } from "./_common.ts";
import { withDBConnection } from "../../db.ts";
import { FullAccountInfo } from "common/data.ts";
import { Account, AccountAttendee, Attendee, Ticket } from "../../db.d.ts";

export default function register(router: Router) {
    const baseRoute = '/account'

    // purchase one or multiple tickets, fill out baseline required attendee info
    defineRoute<FullAccountInfo | null>(router, {
        endpoint: baseRoute,
        method: 'get',
        requireAuth: true,
        handler: async ({ jwt }) => {
            const { account_id } = jwt

            const { rows } = await withDBConnection(async db => {
                return await db.queryObject<Account & Partial<AccountAttendee> & Partial<Attendee> & Partial<Ticket>>`
                    select * from account, account_attendee, attendee, ticket
                        where account.account_id = ${account_id}
                        and account.account_id = account_attendee.account_id
                        and account_attendee.attendee_id = attendee.attendee_id
                        and attendee.ticket_id = ticket.ticket_id
                `
            })

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