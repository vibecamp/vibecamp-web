'use client'

import type { CSSProperties, ReactNode } from 'react'
import { classNames } from '@/lib/ui'
import type { CommonFieldProps } from './_common'
import LoadingDots from './LoadingDots'

export type ButtonStyleProps = {
    isPrimary?: boolean
    isDanger?: boolean
    isCompact?: boolean
    isBorderless?: boolean
    className?: string
    style?: CSSProperties
    children: ReactNode
}

export function buttonClassName({
    isPrimary,
    isDanger,
    isCompact,
    isBorderless,
    className,
}: ButtonStyleProps) {
    return classNames(
        'button',
        isPrimary && 'primary',
        isDanger && 'danger',
        isCompact && 'compact',
        isBorderless && 'borderless',
        className,
    )
}

type Props = ButtonStyleProps &
    Pick<CommonFieldProps<never>, 'disabled'> & {
        onClick?: () => void
        isSubmit?: boolean
        isLoading?: boolean
    }

export default function Button(props: Props) {
    const { style, isSubmit, disabled, isLoading, onClick, isPrimary, isDanger, children } = props

    return (
        <button
            className={buttonClassName(props)}
            style={style}
            type={isSubmit ? 'submit' : 'button'}
            disabled={disabled || isLoading}
            onClick={onClick}
        >
            {isLoading ? (
                <LoadingDots
                    size={18}
                    color={isPrimary || isDanger ? 'rgb(255, 255, 255)' : 'var(--color-primary)'}
                />
            ) : (
                children
            )}
        </button>
    )
}
