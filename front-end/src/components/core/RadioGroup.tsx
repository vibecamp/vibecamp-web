import React from 'react'
import { observer } from 'mobx-react-lite'
import { CommonFieldProps } from './_common'
import { useStable } from '../../mobx/hooks'
import { createTransformer } from 'mobx-utils'

type Props<T> = Omit<CommonFieldProps<T>, 'value'> & {
    value: T | undefined,
    options: readonly { value: T, label: string }[]
}

function RadioGroup<T>({label, value, onChange, disabled, error, options}: Props<T>) {

    const changeHandlers = useStable(() => createTransformer((value: T | typeof NULL) => () =>
        // @ts-expect-error foo
        onChange(value === NULL ? null : value)))
    
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
                        disabled={disabled}
                        checked={value === option.value}
                    />

                    {option.label}
                </label>)}
        </fieldset>
    )
}

const NULL = {} as const

export default observer(RadioGroup)