import React, { CSSProperties } from 'react'
import { observer } from 'mobx-react-lite'
import { useStable } from '../../mobx/hooks'
import { createTransformer } from 'mobx-utils'

type Props<TOption extends string|number> = {
    label: string,
    disabled?: boolean,
    value: TOption,
    onChange: (val: TOption) => void,
    options: readonly TOption[],
}

function RowSelect<TOption extends string|number>({ label, disabled, value, onChange, options}: Props<TOption>) {
    const handleChange = useStable(() => createTransformer((option: TOption) => () => onChange(option)))

    return (
        <div className='row-select' style={{ '--selection-index': options.indexOf(value), '--selection-options': options.length } as CSSProperties}>
            <div className='label'>
                {label}
            </div>

            <div className='options'>
                {options.map((option, index) =>
                    <label className={option === value ? 'selected' : ''} key={index}>
                        {option}

                        <input
                            type='radio'
                            value={option}
                            checked={option === value}
                            onChange={handleChange(option)}
                            disabled={disabled}
                        />
                    </label>)}
            </div>
        </div>
    )
}

export default observer(RowSelect)