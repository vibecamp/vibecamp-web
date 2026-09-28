'use client'

import type { ReactNode } from 'react'
import { classNames } from '@/lib/ui'
import type { CommonFieldProps } from './_common'
import ErrorMessage from './ErrorMessage'

type Props = Omit<CommonFieldProps<boolean>, 'label' | 'value'> & {
    value: boolean | null
    children: ReactNode
}

export default function Checkbox({ value, onChange, disabled, onBlur, error, children }: Props) {
    return (
        <label className={classNames('checkbox', disabled && 'disabled')}>
            <div className='square-and-label'>
                <input
                    type='checkbox'
                    checked={value ?? false}
                    onChange={() => onChange(!value)}
                    onBlur={onBlur}
                    disabled={disabled}
                />

                {children}
            </div>

            <ErrorMessage error={error} />
        </label>
    )
}
