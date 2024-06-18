import React, { CSSProperties, useCallback, useEffect, useState } from 'react'
import { ChangeEvent } from 'react'

import { CommonFieldProps } from './_common'
import ErrorMessage from './ErrorMessage'

type Props = CommonFieldProps<number | null> & {
    placeholder?: string,
    min?: number,
    max?: number,
    style?: CSSProperties // HACK
}

export default React.memo(({ label, value, onChange, onBlur, disabled, error, placeholder, min, max, style }: Props) => {
    const [strValue, setStrValue] = useState(String(value))

    useEffect(() => {
        setStrValue(String(value))
    }, [value])

    const handleChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value

        setStrValue(value)

        const parsed = Number(value)

        if (value !== '' && !isNaN(parsed) && (min == null || parsed >= min) && (max == null || parsed <= max)) {
            onChange(parsed)
        }
    }, [max, min, onChange])

    return (
        <label className='number-input' style={style}>
            <div className='label'>{label}</div>

            <input
                type='number'
                inputMode='numeric'
                placeholder={placeholder}
                step={1}
                value={strValue}
                onChange={handleChange}
                ref={disableWheel}
                onBlur={onBlur}
                disabled={disabled}
                min={min}
                max={max}
            />

            <ErrorMessage error={error} />
        </label>
    )
})

const LISTENER_ADDED = 'listenerAdded'
type WithListenerAddedFlag = { [LISTENER_ADDED]?: boolean }

function disableWheel(_ref: HTMLInputElement | null) {
    const ref = _ref as (HTMLInputElement & WithListenerAddedFlag) | null

    if (ref != null && !ref[LISTENER_ADDED]) {
        ref[LISTENER_ADDED] = true
        ref.addEventListener('wheel', e => e.preventDefault(), { passive: false })
    }
}
