import dayjs, { Dayjs } from 'dayjs'
import React, { ChangeEvent, useCallback, useEffect, useState } from 'react'

import { Maybe } from '../../../../back-end/types/misc'
import { given } from '../../../../back-end/utils/misc'
import { CommonFieldProps } from './_common'
import ErrorMessage from './ErrorMessage'

type Props = CommonFieldProps<Dayjs | null> & {
    min?: Maybe<Dayjs>
}

export default React.memo(({ value, onChange, onBlur, label, disabled, error, min }: Props) => {
    const [strValue, setStrValue] = useState(formatNoTimezone(value))

    useEffect(() => {
        if (value != null) {
            setStrValue(formatNoTimezone(value))
        }
    }, [value])

    const handleChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value

        setStrValue(value)

        const date = dayjs(value)
        if (date.isValid()) {
            onChange(date)
        } else {
            onChange(null)
        }
    }, [onChange])

    return (
        <label className={'date-field' + ' ' + (disabled ? 'disabled' : '')}>
            <div className='label'>{label}</div>

            <input
                type='datetime-local'
                value={strValue ?? ''}
                onChange={handleChange}
                disabled={disabled}
                min={formatNoTimezone(min)}
                onBlur={onBlur}
            />

            <ErrorMessage error={error} />
        </label>
    )
})

export const formatNoTimezone = (d: Maybe<Dayjs>): string => given(d, d => d.format('YYYY-MM-DDTHH:mm')) ?? ''