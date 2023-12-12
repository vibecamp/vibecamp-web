import React, { useCallback } from 'react'
import { observer } from 'mobx-react-lite'
import { CommonFieldProps } from './_common'
import ErrorMessage from './ErrorMessage'

type Props = Omit<CommonFieldProps<boolean>, 'label'> & {
    children: React.ReactNode
}

export default observer(({ value, onChange, error, onBlur, disabled, children }: Props) => {
    const handleChange = useCallback(() => onChange(!value), [value, onChange])

    return (
        <label className={'checkbox' + ' ' + (disabled ? 'disabled' : '')}>
            <input
                type='checkbox'
                checked={value}
                onChange={handleChange}
                onBlur={onBlur}
                disabled={disabled}
                aria-invalid={typeof error === 'string'}
                aria-errormessage={typeof error === 'string' ? error : undefined} />

            {children}

            <ErrorMessage error={error} />
        </label>
    )
})