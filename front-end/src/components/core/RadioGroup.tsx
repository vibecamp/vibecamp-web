import React from 'react'
import { observer } from 'mobx-react-lite'
import { CommonFieldProps } from './_common'
import { useStable } from '../../mobx/hooks'
import ErrorMessage from './ErrorMessage'

type Props<T> = Omit<CommonFieldProps<T>, 'value'> & {
    value: T | undefined,
    options: readonly { value: T, label: string }[]
}

function RadioGroup<T>({ label, value, onChange, disabled, error, onBlur, options }: Props<T>) {

    const changeHandlers = useStable(() => (value: T | typeof NULL) => () =>
        // @ts-expect-error null requires a workaround
        onChange(value === NULL ? null : value))

    return (
        <fieldset className={`radio-group ${disabled ? 'disabled' : ''}`}>
            <legend>{label}</legend>

            {options.map((option, index) =>
                <label key={index}>
                    <input
                        type="radio"
                        name={label}
                        value={String(option.value)}
                        onChange={changeHandlers(option.value ?? NULL)}
                        onBlur={onBlur}
                        disabled={disabled}
                        checked={value === option.value}
                        aria-invalid={error != null}
                        aria-errormessage={error}
                    />

                    {option.label}
                </label>)}

            <ErrorMessage error={error} />
        </fieldset>
    )
}

const NULL = {} as const

export default observer(RadioGroup)