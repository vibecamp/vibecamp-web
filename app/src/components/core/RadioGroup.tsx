'use client'

import { classNames } from '@/lib/ui'
import type { CommonFieldProps } from './_common'
import ErrorMessage from './ErrorMessage'

type Props<T> = Omit<CommonFieldProps<T>, 'value'> & {
    value: T | undefined
    options: readonly { value: T; label: string }[]
    direction?: 'column' | 'row'
}

function RadioGroup<T>({
    disabled,
    direction,
    label,
    value,
    onChange,
    onBlur,
    error,
    options,
}: Props<T>) {
    return (
        <fieldset className={classNames('radio-group', disabled && 'disabled', direction)}>
            {label && <legend>{label}</legend>}

            {options.map((option) => (
                <label key={String(option.value)}>
                    <input
                        type='radio'
                        name={label}
                        value={String(option.value)}
                        onChange={() => onChange(option.value)}
                        onBlur={onBlur}
                        disabled={disabled}
                        checked={value === option.value}
                    />

                    {option.label}
                </label>
            ))}

            <ErrorMessage error={error} />
        </fieldset>
    )
}

export default RadioGroup
