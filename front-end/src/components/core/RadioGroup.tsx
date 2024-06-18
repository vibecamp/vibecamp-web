import React from 'react'

import { CommonFieldProps } from './_common'
import ErrorMessage from './ErrorMessage'

type Props<T> = Omit<CommonFieldProps<T>, 'value'> & {
    value: T | undefined,
    options: readonly { value: T, label: string }[],
    directon?: 'column' | 'row'
}

function RadioGroup<T>({ disabled, directon, label, value, onChange, onBlur, error, options }: Props<T>) {
    return (
        <fieldset className={`radio-group ${disabled ? 'disabled' : ''} ${directon}`}>
            {label &&
                <legend>{label}</legend>}

            {options.map((option, index) =>
                <label key={index}>
                    <input
                        type="radio"
                        name={label}
                        value={String(option.value)}
                        onChange={() =>
                            // @ts-expect-error null requires a workaround
                            onChange(option.value === NULL ? null : option.value)}
                        onBlur={onBlur}
                        disabled={disabled}
                        checked={value === option.value}
                        aria-invalid={typeof error === 'string'}
                        aria-errormessage={typeof error === 'string' ? error : undefined}
                    />

                    {option.label}
                </label>)}

            <ErrorMessage error={error} />
        </fieldset>
    )
}

const NULL = {} as const

export default React.memo(RadioGroup) as typeof RadioGroup