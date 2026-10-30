import { t } from '@/copy/t'
import type { DayjsEvent } from '@/hooks/useStore'
import dayjs, { type Dayjs } from '@/lib/dayjs'

export const formatEventTime = (event: Pick<DayjsEvent, 'start_datetime' | 'end_datetime'>) => {
    const now = dayjs.utc()
    const timeOnly = t('events.timeFormat')
    const dateAndTime = (d: Dayjs) =>
        d.format(
            now.isSame(d, 'year')
                ? t('events.dateTimeFormatThisYear')
                : t('events.dateTimeFormatOtherYear'),
        )
    const separator = t('events.timeRangeSeparator')

    if (event.end_datetime == null) {
        return dateAndTime(event.start_datetime)
    }
    if (event.end_datetime.isSame(event.start_datetime, 'day')) {
        return `${dateAndTime(event.start_datetime)}${separator}${event.end_datetime.format(timeOnly)}`
    }
    return `${dateAndTime(event.start_datetime)}${separator}${dateAndTime(event.end_datetime)}`
}
