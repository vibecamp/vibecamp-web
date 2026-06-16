import 'react-datepicker/dist/react-datepicker.css'

import dayjs, { Dayjs } from 'dayjs'
import React, { useCallback, useMemo } from 'react'
import DatePicker from 'react-datepicker'

import { Maybe } from '../../../../back-end/types/misc'
import { given } from '../../../../back-end/utils/misc'
import { CommonFieldProps } from './_common'
import ErrorMessage from './ErrorMessage'

type Props = CommonFieldProps<Dayjs | null> & {
    min?: Maybe<Dayjs>
}

// react-datepicker speaks JS `Date`, which is always a UTC instant viewed
// through the browser's local zone. We treat datetimes as naive wall-clock
// values, so we shuttle each component (Y/M/D/H/m) across the boundary
// explicitly to avoid any local-zone interpretation drift — relevant for
// users in non-UTC zones, since stored Dayjs values are `dayjs.utc(...)`.
function dayjsToWallClockDate (d: Dayjs): Date {
    return new Date(d.year(), d.month(), d.date(), d.hour(), d.minute(), 0, 0)
}

function wallClockDateToDayjs (d: Date): Dayjs {
    return dayjs.utc()
        .year(d.getFullYear())
        .month(d.getMonth())
        .date(d.getDate())
        .hour(d.getHours())
        .minute(d.getMinutes())
        .second(0)
        .millisecond(0)
}

export default React.memo(({ value, onChange, onBlur, label, disabled, error, min }: Props) => {
    const selected = useMemo(() => (value ? dayjsToWallClockDate(value) : null), [value])
    const minDate = useMemo(() => (min ? dayjsToWallClockDate(min) : undefined), [min])

    // react-datepicker's `minDate` only blocks earlier calendar days; on the
    // boundary day we also need `minTime`/`maxTime` to block earlier times.
    const { minTime, maxTime } = useMemo(() => {
        if (min == null) return { minTime: undefined, maxTime: undefined }
        const sameDay = value != null && value.isSame(min, 'day')
        if (!sameDay) return { minTime: undefined, maxTime: undefined }
        return {
            minTime: dayjsToWallClockDate(min),
            maxTime: dayjsToWallClockDate(min.endOf('day')),
        }
    }, [min, value])

    const handleChange = useCallback((d: Date | null) => {
        onChange(d ? wallClockDateToDayjs(d) : null)
    }, [onChange])

    return (
        <label className={'date-field' + ' ' + (disabled ? 'disabled' : '')}>
            <div className='label'>{label}</div>

            <DatePicker
                selected={selected}
                onChange={handleChange}
                onBlur={onBlur}
                disabled={disabled}
                showTimeSelect
                timeIntervals={15}
                timeFormat='h:mmaa'
                dateFormat='yyyy-MM-dd h:mmaa'
                minDate={minDate}
                minTime={minTime}
                maxTime={maxTime}
                wrapperClassName='date-field-picker'
                popperClassName='date-field-popper'
            />

            <ErrorMessage error={error} />
        </label>
    )
})

export function formatNoTimezone (d: Dayjs): string;
export function formatNoTimezone (d: Maybe<Dayjs>): Maybe<string>;
export function formatNoTimezone (d: Maybe<Dayjs>): Maybe<string> {
    return given(d, d => d.format('YYYY-MM-DDTHH:mm'))
}
