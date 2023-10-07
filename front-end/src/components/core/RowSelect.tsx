import React, { CSSProperties } from 'react'
import { observer } from 'mobx-react-lite'

type Props<TOption extends string|number> = {
    label: string,
    disabled?: boolean,
    value: TOption,
    onChange: (val: TOption) => void,
    options: readonly TOption[],
}

function RowSelect<TOption extends string|number>({ label, disabled, value, onChange, options}: Props<TOption>) {

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
                            onChange={() => onChange(option)}
                            disabled={disabled}
                        />
                    </label>)}
            </div>
        </div>
    )
}

export default observer(RowSelect)