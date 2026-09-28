'use client'

import { classNames } from '@/lib/ui'
import Icon from '../core/Icon'

type Props = {
    value: number
    min?: number
    max: number
    disabled?: boolean
    onChange: (next: number) => void
}

export default function Stepper({ value, min = 0, max, disabled, onChange }: Props) {
    return (
        <div className={classNames('stepper', value === 0 && 'zero')}>
            <button
                type='button'
                disabled={disabled || value <= min}
                onClick={() => onChange(value - 1)}
            >
                <Icon name='remove' />
            </button>
            <output>{value}</output>
            <button
                type='button'
                disabled={disabled || value >= max}
                onClick={() => onChange(value + 1)}
            >
                <Icon name='add' />
            </button>
        </div>
    )
}
