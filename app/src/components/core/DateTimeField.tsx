'use client'

import 'react-datepicker/dist/react-datepicker.css'

import { useCallback, useMemo } from 'react'
import DatePicker from 'react-datepicker'
import type { Maybe } from '@/contract/misc'
import dayjs, { type Dayjs } from '@/lib/dayjs'
import { classNames } from '@/lib/ui'
import type { CommonFieldProps } from './_common'
import ErrorMessage from './ErrorMessage'

type Props = CommonFieldProps<Dayjs | null> & {
    min?: Maybe<Dayjs>
}

function dayjsToWallClockDate(d: Dayjs): Date {
    return new Date(d.year(), d.month(), d.date(), d.hour(), d.minute(), 0, 0)
}

function wallClockDateToDayjs(d: Date): Dayjs {
    return dayjs
        .utc()
        .year(d.getFullYear())
        .month(d.getMonth())
        .date(d.getDate())
        .hour(d.getHours())
        .minute(d.getMinutes())
        .second(0)
        .millisecond(0)
}

export default function DateTimeField({
    value,
    onChange,
    onBlur,
    label,
    disabled,
    error,
    min,
}: Props) {
    const selected = useMemo(() => (value ? dayjsToWallClockDate(value) : null), [value])
    const minDate = useMemo(() => (min ? dayjsToWallClockDate(min) : undefined), [min])

    const { minTime, maxTime } = useMemo(() => {
        if (min == null) return { minTime: undefined, maxTime: undefined }
        const sameDay = value?.isSame(min, 'day')
        if (!sameDay) return { minTime: undefined, maxTime: undefined }
        return {
            minTime: dayjsToWallClockDate(min),
            maxTime: dayjsToWallClockDate(min.endOf('day')),
        }
    }, [min, value])

    const handleChange = useCallback(
        (d: Date | null) => {
            onChange(d ? wallClockDateToDayjs(d) : null)
        },
        [onChange],
    )

    return (
        // biome-ignore lint/a11y/noLabelWithoutControl: DatePicker renders the <input> inside this label
        <label className={classNames('date-field', disabled && 'disabled')}>
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
}

export function formatNoTimezone(d: Dayjs): string
export function formatNoTimezone(d: Maybe<Dayjs>): Maybe<string>
export function formatNoTimezone(d: Maybe<Dayjs>): Maybe<string> {
    return d == null ? d : d.format('YYYY-MM-DDTHH:mm')
}
