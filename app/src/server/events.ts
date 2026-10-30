import { and, eq, sql } from 'drizzle-orm'
import { z } from 'zod'
import type { Routes } from '@/contract/route-types'
import { db, transaction } from '@/db'
import * as s from '@/db/schema'
import type { Tables } from '@/db/types'
import dayjs from '@/lib/dayjs'
import type { Status } from '@/lib/define-route'
import { festivalOf } from '@/lib/rules'
import { avNeedsEmail, sendMail } from './mail'

type AccountId = Tables['account']['account_id']
type EventId = Tables['event']['event_id']

const stringifyDate = (value: string | Date) => dayjs.utc(value).toISOString()

type EventRow = Tables['event'] & {
    creator_name: string | null
    bookmarks: string | number
    location_name: string
}

export async function getAllEvents(
    viewerAccountId?: AccountId,
): Promise<Routes['/events']['response']['events']> {
    const ticketFestivals =
        viewerAccountId == null
            ? []
            : await db
                  .select({ start_date: s.festival.start_date, end_date: s.festival.end_date })
                  .from(s.purchase)
                  .innerJoin(
                      s.purchase_type,
                      eq(s.purchase.purchase_type_id, s.purchase_type.purchase_type_id),
                  )
                  .innerJoin(s.festival, eq(s.purchase_type.festival_id, s.festival.festival_id))
                  .where(
                      and(
                          eq(s.purchase.owned_by_account_id, viewerAccountId),
                          eq(s.purchase_type.is_attendance_ticket, true),
                      ),
                  )
    const result = await db.execute<EventRow>(sql`
      SELECT * FROM
      (
        SELECT DISTINCT ON (event.event_id)
          event.name,
          event.description,
          event.start_datetime,
          event.end_datetime,
          event.location_id,
          location.name as location_name,
          event.event_id,
          event.created_by_account_id,
          event.event_type,
          event.will_be_filmed,
          event.av_needs,
          event.public,
          event.tags,
          event.last_modified,
          attendee.name as creator_name,
          COUNT(event_bookmark.account_id) as bookmarks
        FROM event
        LEFT JOIN account ON event.created_by_account_id = account.account_id
        LEFT JOIN attendee ON account.account_id = attendee.associated_account_id
        LEFT JOIN event_bookmark ON event_bookmark.event_id = event.event_id
        JOIN location ON location.location_id = event.location_id
        WHERE
          attendee.is_primary_for_account is null OR
          attendee.is_primary_for_account = true
        GROUP BY
          event.name,
          event.description,
          event.start_datetime,
          event.end_datetime,
          location.name,
          event.location_id,
          event.event_id,
          event.created_by_account_id,
          event.event_type,
          event.will_be_filmed,
          event.av_needs,
          event.public,
          event.tags,
          event.last_modified,
          account.email_address,
          attendee.name
        ORDER BY
          event.event_id
      ) events
      ORDER BY start_datetime
    `)

    const visible = result.rows.filter(
        (e) =>
            e.public ||
            e.created_by_account_id === viewerAccountId ||
            festivalOf(e.start_datetime, ticketFestivals) != null,
    )

    return visible.map(({ bookmarks, ...e }) => ({
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
        location_id: event.location_id,
        tags: event.tags,
        av_needs,
        public: event.public,
        last_modified,
    }

    if (!z.uuid().safeParse(event.location_id).success) {
        return 400
    }

    return transaction(async (tx) => {
        const place = (
            await tx.select().from(s.location).where(eq(s.location.location_id, event.location_id))
        )[0]
        if (place == null) {
            return 400
        }
        const selectable = place.events_allowed && place.deleted_at == null

        if (!event.public) {
            const festivals = await tx
                .select({ start_date: s.festival.start_date, end_date: s.festival.end_date })
                .from(s.festival)
            if (festivalOf(event.start_datetime, festivals) == null) {
                return 400
            }
        }

        if (event.event_id) {
            const existing = (
                await tx.select().from(s.event).where(eq(s.event.event_id, event.event_id))
            )[0]
            if (existing?.created_by_account_id !== account_id) {
                return 401
            }
            if (!selectable && existing.location_id !== event.location_id) {
                return 409
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
        if (!selectable) {
            return 409
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
        .where(and(eq(s.event.event_id, event_id), eq(s.event.public, true)))
        .limit(1)
    return rows[0]
}

async function notifyAvNeeds(
    event: {
        name: string
        description: string
        start_datetime: string
        end_datetime: string | null
        location_id: string
        av_needs: string
    },
    account_id: AccountId,
) {
    try {
        const [account, attendees, place] = await Promise.all([
            (await db.select().from(s.account).where(eq(s.account.account_id, account_id)))[0],
            db.select().from(s.attendee).where(eq(s.attendee.associated_account_id, account_id)),
            db.select().from(s.location).where(eq(s.location.location_id, event.location_id)),
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
                place[0]?.name ?? null,
            ),
        )
    } catch (err) {
        console.error('Failed to send A/V needs email:', err)
    }
}
