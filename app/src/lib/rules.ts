import dayjs, { type Dayjs } from './dayjs'

type DateLike = string | Date | Dayjs

export function festivalOf<F extends { start_date: DateLike; end_date: DateLike }>(
    eventStart: DateLike,
    festivals: readonly F[] | undefined,
): F | undefined {
    const start = dayjs.utc(eventStart)
    return festivals?.find(
        (f) =>
            !start.isBefore(dayjs.utc(f.start_date).subtract(1, 'day')) &&
            start.isBefore(dayjs.utc(f.end_date).add(2, 'day')),
    )
}

type EventTimes = {
    start_datetime: Dayjs | null
    end_datetime: Dayjs | null
    event_site_location: string | null
    event_id: string | undefined
}

export function checkInProgressEventOverlap(
    newEvent: EventTimes,
    existingEvent: EventTimes & { start_datetime: Dayjs; event_id: string },
): boolean {
    if (
        !newEvent.start_datetime ||
        !newEvent.event_site_location ||
        !existingEvent.event_site_location ||
        (newEvent.event_id &&
            existingEvent.event_id &&
            newEvent.event_id === existingEvent.event_id) ||
        newEvent.event_site_location !== existingEvent.event_site_location
    ) {
        return false
    }

    const start1 = newEvent.start_datetime.utc(true)
    const start2 = existingEvent.start_datetime.utc(true)
    const end1 = newEvent.end_datetime?.utc(true)
    const end2 = existingEvent.end_datetime?.utc(true)

    if (!end1) {
        if (!end2) {
            return start1.isSame(start2)
        }

        return start1.isAfter(start2) && start1.isBefore(end2)
    }
    if (!end2) {
        return start2.isAfter(start1) && start2.isBefore(end1)
    }

    return start1.isBefore(end2) && end1.isAfter(start2)
}
