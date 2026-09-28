'use client'

import type { CSSProperties } from 'react'
import { classNames } from '@/lib/ui'

type Props<TOption extends string | number> = {
    label?: string
    disabled?: boolean
    value: TOption | undefined
    onChange: (val: TOption) => void
    options: readonly TOption[]
    style?: CSSProperties
}

function RowSelect<TOption extends string | number>({
    style,
    value,
    onChange,
    label,
    options,
    disabled,
}: Props<TOption>) {
    return (
        <div
            className='row-select'
            style={
                {
                    ...style,
                    '--selection-index': value != null ? options.indexOf(value) : -1,
                    '--selection-options': options.length,
                } as CSSProperties
            }
        >
            {label && <div className='label'>{label}</div>}

            <div className='options'>
                {options.map((option) => (
                    <label className={classNames(option === value && 'selected')} key={option}>
                        {option}

                        <input
                            type='radio'
                            value={option}
                            checked={option === value}
                            onChange={() => onChange(option)}
                            disabled={disabled}
                        />
                    </label>
                ))}
            </div>
        </div>
    )
}

export default RowSelect
