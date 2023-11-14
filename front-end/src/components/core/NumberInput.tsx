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
            <div>{label}</div>

            <input
                type='number'
                inputMode='numeric'
                placeholder={placeholder}
                step={1}
                value={strValue}
                onChange={handleChange}
                onBlur={onBlur}
                disabled={disabled}
            />

            <ErrorMessage error={error} />
        </label>
    )
})