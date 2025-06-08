import { assertEquals } from 'https://deno.land/std@0.220.0/assert/assert_equals.ts'
import { EventInfo } from '../routes/v1/event.ts'
import dayjs, { Dayjs } from './dayjs.ts'
import { given } from './misc.ts'

const icsFields = (fields: Record<string, string | number | null | undefined>) =>
    Object.entries(fields)
        .filter(([key, value]) => value != null)
        .map(([key, value]) => `${key}:${String(value).replaceAll(/\n/gm, '\\n')}`)
        .join('\n')

const padZero = (n: number) => n < 10 ? '0' + n : '' + n

/**
 * Take a datetime from the DB (assumed to be "no timezone") and convert it
 * into a UTC-correct and formatted datetime string for iCal
 */
const icsDatetime = (raw: Dayjs) => {
    // convert from no-timezone to actual UTC (with assumed east-coast time)
    const date = raw.add(4, 'hours')

    return (
        '' +
        date.year() +
        padZero(date.month() + 1) +
        padZero(date.date()) +
        'T' +
        padZero(date.hour()) +
        padZero(date.minute()) +
        padZero(date.second()) +
        'Z'
    )
}

/**
 * Serialize one event in iCal format
 */
export const icsEvent = (event: EventInfo) => {
    const now = dayjs()

    return icsFields({
        BEGIN: 'VEVENT',
        UID: event.event_id + '@my.vibe.camp',
        DTSTAMP: icsDatetime(now),
        // @ts-ignore
        DTSTART: icsDatetime(dayjs.utc(event.start_datetime)),
        // @ts-ignore
        DTEND: given(event.end_datetime, end_datetime => icsDatetime(dayjs.utc(end_datetime))),
        SUMMARY: event.name,
        DESCRIPTION: event.description,
        LOCATION: event.event_site_location_name || event.plaintext_location || '',
        [`ORGANIZER;CN=${event.creator_name}`]: 'MAILTO:no-reply@vibe.camp',
        STATUS: 'CONFIRMED',
        SEQUENCE: Math.floor(now.valueOf() / 1_000),
        END: 'VEVENT'
    })
}

/**
 * Serialize a sequence of events as a complete iCal calendar
 */
export const icsCalendar = (name: string, events: readonly EventInfo[]) => {
    return (
        icsFields({
            BEGIN: 'VCALENDAR',
            VERSION: '2.0',
            PRODID: `-//Vibecamp//Event Schedule//EN`,
            'X-WR-CALNAME': name,
            CALSCALE: 'GREGORIAN',
            METHOD: 'PUBLISH'
        }) +
        '\n\n' +
        events.map(icsEvent).join('\n\n') +
        '\n\n' +
        icsFields({
            END: 'VCALENDAR'
        })
    )
}

Deno.test({
    name: 'Calendar generation',
    fn() {
        const testEvent = {
            "name": "Vibeclipse Meet n Greet",
            "description": "Coming to Vibeclipse? New to the Vibe Camp phenomenon or just can't wait til camp to see the new faces? Come hang out in the Vibeclipse Meet n Greet virtual hangout space!",
            "start_datetime": "2024-04-02T18:00:00.000Z",
            "end_datetime": "2024-04-02T20:00:00.000Z",
            "plaintext_location": "Google Meet details:\nVibeclipse Meet n Greet\nTuesday, 2 April · 6:00 – 8:00pm\nTime zone: America/Vancouver\nGoogle Meet joining info\nVideo call link: https://meet.google.com/zvh-hpnn-yjk\nOr dial: ‪(CA) +1 705-419-6575‬ PIN: ‪770 698 765‬#\nMore phone numbers: https://tel.meet/zvh-hpnn-yjk?pin=977054262802",
            "event_site_location": null,
            "event_site_location_name": null,
            "event_id": "08cebb80-744b-42a6-8b1e-3e42ee3b4d29",
            "created_by_account_id": "a4b53de7-22ed-43a1-9c93-f25d7ccef421",
            "event_type": "UNOFFICIAL",
            "will_be_filmed": false,
            "creator_name": "Mattias in Space",
            "bookmarks": 7
        } as EventInfo

        const ics = icsCalendar('Vibecamp Event Schedule', [testEvent])

        const expected = `
        BEGIN:VCALENDAR
        VERSION:2.0
        PRODID:-//Vibecamp//Event Schedule//EN
        X-WR-CALNAME:Vibecamp Event Schedule
        CALSCALE:GREGORIAN
        METHOD:PUBLISH

        BEGIN:VEVENT
        UID:08cebb80-744b-42a6-8b1e-3e42ee3b4d29@my.vibe.camp
        DTSTAMP:20240401T120000Z
        DTSTART:20240402T220000Z
        DTEND:20240403T000000Z
        SUMMARY:Vibeclipse Meet n Greet
        DESCRIPTION:Coming to Vibeclipse? New to the Vibe Camp phenomenon or just can't wait til camp to see the new faces? Come hang out in the Vibeclipse Meet n Greet virtual hangout space!
        LOCATION:Google Meet details:\\nVibeclipse Meet n Greet\\nTuesday, 2 April · 6:00 – 8:00pm\\nTime zone: America/Vancouver\\nGoogle Meet joining info\\nVideo call link: https://meet.google.com/zvh-hpnn-yjk\\nOr dial: ‪(CA) +1 705-419-6575‬ PIN: ‪770 698 765‬#\\nMore phone numbers: https://tel.meet/zvh-hpnn-yjk?pin=977054262802
        ORGANIZER;CN=Mattias in Space:MAILTO:no-reply@vibe.camp
        STATUS:CONFIRMED
        SEQUENCE:0
        END:VEVENT

        END:VCALENDAR
        `.trim().replaceAll(/^[ ]+/gm, '')

        assertEquals(
            ics.replace(/SEQUENCE:[0-9]+\n/, '').replace(/DTSTAMP:.*\n/, ''),
            expected.replace(/SEQUENCE:[0-9]+\n/, '').replace(/DTSTAMP:.*\n/, '')
        )
    }
})
