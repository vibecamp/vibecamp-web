import React from 'react'
import { observer } from 'mobx-react-lite'
import { CommonFieldProps } from './_common'
import ErrorMessage from './ErrorMessage'
import { ChangeEvent, useCallback, useEffect, useState } from 'react'

type Props = CommonFieldProps<number | null> & {
    placeholder?: string
}

export default observer(({ label, value, onChange, disabled, error, onBlur, placeholder }: Props) => {
    const [strValue, setStrValue] = useState(String(value))

    useEffect(() => {
        setStrValue(String(value))
    }, [value])

    const handleChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value

        setStrValue(value)

        if (value !== '' && !isNaN(Number(value))) {
            onChange(Number(value))
        }
    }, [onChange])

    return (
        <label className='number-input'>
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
