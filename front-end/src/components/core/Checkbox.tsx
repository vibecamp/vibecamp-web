import React, { useCallback } from 'react'

import { CommonFieldProps } from './_common'
import ErrorMessage from './ErrorMessage'

type Props = Omit<CommonFieldProps<boolean>, 'label' | 'value'> & {
    value: boolean | null,
    children: React.ReactNode
}

export default React.memo(({ value, onChange, disabled, onBlur, error, children }: Props) => {
    const handleChange = useCallback(() => {
        onChange(!value)
    }, [onChange, value])

    return (
        <label className={'checkbox' + ' ' + (disabled ? 'disabled' : '')}>
            <input
                type='checkbox'
                checked={value ?? false}
                onChange={handleChange}
                onBlur={onBlur}
                disabled={disabled}
                aria-invalid={typeof error === 'string'}
                aria-errormessage={typeof error === 'string' ? error : undefined}
            />

            {children}

            <ErrorMessage error={error} />
        </label>
    )
})