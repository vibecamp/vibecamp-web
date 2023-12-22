import React from 'react'

import { useStable } from '../../mobx/hooks'
import { observer } from '../../mobx/misc'
import { CommonFieldProps } from './_common'
import ErrorMessage from './ErrorMessage'

type Props<T> = Omit<CommonFieldProps<T>, 'value'> & {
    value: T | undefined,
    options: readonly { value: T, label: string }[],
    directon?: 'column' | 'row'
}

function RadioGroup<T>(props: Props<T>) {

    const changeHandlers = useStable(() => (value: T | typeof NULL) => () =>
        // @ts-expect-error null requires a workaround
        props.onChange(value === NULL ? null : value))

    return (
        <fieldset className={`radio-group ${props.disabled ? 'disabled' : ''} ${props.directon}`}>
            {props.label &&
                <legend>{props.label}</legend>}

            {props.options.map((option, index) =>
                <label key={index}>
                    <input
                        type="radio"
                        name={props.label}
                        value={String(option.value)}
                        onChange={changeHandlers(option.value ?? NULL)}
                        onBlur={props.onBlur}
                        disabled={props.disabled}
                        checked={props.value === option.value}
                        aria-invalid={typeof props.error === 'string'}
                        aria-errormessage={typeof props.error === 'string' ? props.error : undefined}
                    />

                    {option.label}
                </label>)}

            <ErrorMessage error={props.error} />
        </fieldset>
    )
}

const NULL = {} as const

export default observer(RadioGroup)