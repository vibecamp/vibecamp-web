import { createTransformer } from 'mobx-utils'
import React, { CSSProperties } from 'react'

import { useStable } from '../../mobx/hooks'
import { observer } from '../../mobx/misc'

type Props<TOption extends string|number> = {
    label: string,
    disabled?: boolean,
    value: TOption,
    onChange: (val: TOption) => void,
    options: readonly TOption[],
}

function RowSelect<TOption extends string|number>(props: Props<TOption>) {
    const handleChange = useStable(() => createTransformer((option: TOption) => () => props.onChange(option)))

    return (
        <div className='row-select' style={{ '--selection-index': props.options.indexOf(props.value), '--selection-options': props.options.length } as CSSProperties}>
            <div className='label'>
                {props.label}
            </div>

            <div className='options'>
                {props.options.map((option, index) =>
                    <label className={option === props.value ? 'selected' : ''} key={index}>
                        {option}

                        <input
                            type='radio'
                            value={option}
                            checked={option === props.value}
                            onChange={handleChange(option)}
                            disabled={props.disabled}
                        />
                    </label>)}
            </div>
        </div>
    )
}

export default observer(RowSelect)