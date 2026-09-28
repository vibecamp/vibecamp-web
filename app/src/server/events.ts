import { and, eq, sql } from 'drizzle-orm'
import type { Routes } from '@/contract/route-types'
import { db, transaction } from '@/db'
import * as s from '@/db/schema'
import type { Tables } from '@/db/types'
import dayjs from '@/lib/dayjs'
import type { Status } from '@/lib/define-route'
import { avNeedsEmail, sendMail } from './mail'

type AccountId = Tables['account']['account_id']
type EventId = Tables['event']['event_id']

const stringifyDate = (value: string | Date) => dayjs.utc(value).toISOString()

type EventRow = Tables['event'] & {
    creator_name: string | null
    bookmarks: string | number
    event_site_location_name: string | null
}

export async function getAllEvents(): Promise<Routes['/events']['response']['events']> {
    const result = await db.execute<EventRow>(sql`
      SELECT * FROM
      (
        SELECT DISTINCT ON (event.event_id)
          event.name,
          event.description,
          event.start_datetime,
          event.end_datetime,
          event.plaintext_location,
          event.event_site_location,
          event_site.name as event_site_location_name,
          event.event_id,
          event.created_by_account_id,
          event.event_type,
          event.will_be_filmed,
          event.av_needs,
          event.tags,
          event.last_modified,
          attendee.name as creator_name,
          COUNT(event_bookmark.account_id) as bookmarks
        FROM event
        LEFT JOIN account ON event.created_by_account_id = account.account_id
        LEFT JOIN attendee ON account.account_id = attendee.associated_account_id
        LEFT JOIN event_bookmark ON event_bookmark.event_id = event.event_id
        LEFT JOIN event_site ON event_site.event_site_id = event.event_site_location
        WHERE
          attendee.is_primary_for_account is null OR
          attendee.is_primary_for_account = true
        GROUP BY
          event.name,
          event.description,
          event.start_datetime,
          event.end_datetime,
          event.plaintext_location,
          event_site.name,
          event.event_site_location,
          event.event_id,
          event.created_by_account_id,
          event.event_type,
          event.will_be_filmed,
          event.av_needs,
          event.tags,
          event.last_modified,
          account.email_address,
          attendee.name
        ORDER BY
          event.event_id
      ) events
      ORDER BY start_datetime
    `)

    return result.rows.map(({ bookmarks, ...e }) => ({
        ...e,
        start_datetime: stringifyDate(e.start_datetime),
        end_datetime: e.end_datetime == null ? null : stringifyDate(e.end_datetime),
        last_modified: e.last_modified == null ? null : stringifyDate(e.last_modified),
        bookmarks: Number(bookmarks),
    }))
}

const recentlySavedEventsJson = new Set<string>()
setInterval(() => recentlySavedEventsJson.clear(), 1_000).unref()

export async function saveEvent(
    account_id: AccountId,
    event: Routes['/event/save']['body']['event'],
): Promise<Status> {
    const eventJson = JSON.stringify(event)
    if (recentlySavedEventsJson.has(eventJson)) {
        return 200
    }
    recentlySavedEventsJson.add(eventJson)

    const last_modified = new Date().toISOString()
    const av_needs =
        typeof event.av_needs === 'string' && event.av_needs.trim() !== '' ? event.av_needs : null
    const columns = {
        name: event.name,
        description: event.description,
        start_datetime: event.start_datetime,
        end_datetime: event.end_datetime,
        event_site_location: event.event_site_location,
        plaintext_location: event.event_site_location ? null : event.plaintext_location,
        tags: event.tags,
        av_needs,
        last_modified,
    }

    return transaction(async (tx) => {
        if (event.event_id) {
            const existing = (
                await tx.select().from(s.event).where(eq(s.event.event_id, event.event_id))
            )[0]
            if (existing?.created_by_account_id !== account_id) {
                return 401
            }
            await tx.update(s.event).set(columns).where(eq(s.event.event_id, event.event_id))

            if (existing.av_needs == null && av_needs != null) {
                await notifyAvNeeds({ ...columns, av_needs }, account_id)
            }
            return 200
        }

        const [accountPurchases, purchaseTypes] = await Promise.all([
            tx.select().from(s.purchase).where(eq(s.purchase.owned_by_account_id, account_id)),
            tx.select().from(s.purchase_type),
        ])
        const holdsTicket = accountPurchases.some(
            (p) =>
                purchaseTypes.find((t) => t.purchase_type_id === p.purchase_type_id)
                    ?.is_attendance_ticket,
        )
        if (!holdsTicket) {
            return 401
        }

        await tx.insert(s.event).values({ ...columns, created_by_account_id: account_id })

        if (av_needs != null) {
            await notifyAvNeeds({ ...columns, av_needs }, account_id)
        }
        return 200
    })
}

export async function deleteEvent(account_id: AccountId, event_id: EventId): Promise<Status> {
    return transaction(async (tx) => {
        const existing = (await tx.select().from(s.event).where(eq(s.event.event_id, event_id)))[0]
        if (existing == null || existing.created_by_account_id !== account_id) {
            return 401
        }
        await tx.delete(s.event_bookmark).where(eq(s.event_bookmark.event_id, event_id))
        await tx.delete(s.event).where(eq(s.event.event_id, event_id))
        return 200
    })
}

export async function getBookmarks(account_id: AccountId): Promise<EventId[]> {
    const rows = await db
        .select({ event_id: s.event_bookmark.event_id })
        .from(s.event_bookmark)
        .where(eq(s.event_bookmark.account_id, account_id))
    return rows.map((r) => r.event_id)
}

export async function bookmarkEvent(account_id: AccountId, event_id: EventId): Promise<Status> {
    await db.insert(s.event_bookmark).values({ account_id, event_id })
    return 200
}

export async function unbookmarkEvent(account_id: AccountId, event_id: EventId): Promise<Status> {
    await db
        .delete(s.event_bookmark)
        .where(
            and(
                eq(s.event_bookmark.account_id, account_id),
                eq(s.event_bookmark.event_id, event_id),
            ),
        )
    return 200
}

export async function getEventForShare(event_id: EventId) {
    const rows = await db
        .select({
            event_id: s.event.event_id,
            name: s.event.name,
            description: s.event.description,
            event_type: s.event.event_type,
            creator_name: s.attendee.name,
        })
        .from(s.event)
        .leftJoin(s.account, eq(s.event.created_by_account_id, s.account.account_id))
        .leftJoin(
            s.attendee,
            and(
                eq(s.account.account_id, s.attendee.associated_account_id),
                eq(s.attendee.is_primary_for_account, true),
            ),
        )
        .where(eq(s.event.event_id, event_id))
        .limit(1)
    return rows[0]
}

async function notifyAvNeeds(
    event: {
        name: string
        description: string
        start_datetime: string
        end_datetime: string | null
        event_site_location: string | null
        av_needs: string
    },
    account_id: AccountId,
) {
    try {
        const [account, attendees, eventSite] = await Promise.all([
            (await db.select().from(s.account).where(eq(s.account.account_id, account_id)))[0],
            db.select().from(s.attendee).where(eq(s.attendee.associated_account_id, account_id)),
            event.event_site_location
                ? (
                      await db
                          .select()
                          .from(s.event_site)
                          .where(eq(s.event_site.event_site_id, event.event_site_location))
                  )[0]
                : undefined,
        ])
        if (account == null) return
        const primaryAttendee = attendees.find((a) => a.is_primary_for_account) ?? attendees[0]

        await sendMail(
            avNeedsEmail(
                {
                    name: event.name,
                    description: event.description,
                    start_datetime: new Date(event.start_datetime),
                    end_datetime: event.end_datetime ? new Date(event.end_datetime) : null,
                    av_needs: event.av_needs,
                },
                { name: primaryAttendee?.name ?? null, email_address: account.email_address },
                eventSite?.name ?? null,
            ),
        )
    } catch (err) {
        console.error('Failed to send A/V needs email:', err)
    }
}
