import React, { CSSProperties } from 'react'

import { CommonFieldProps } from './_common'
import LoadingDots from './LoadingDots'

type Props = Pick<CommonFieldProps<never>, 'disabled'> & {
    onClick?: () => void,
    isSubmit?: boolean,
    isPrimary?: boolean,
    isDanger?: boolean,
    isLoading?: boolean,
    isCompact?: boolean,
    isBorderless?: boolean,
    children: React.ReactNode,
    className?: string,
    style?: CSSProperties
}

export default React.memo(({ isPrimary, isDanger, isCompact, isBorderless, className, style, isSubmit, disabled, isLoading, onClick, children }: Props) => {

    return (
        <button
            className={'button' + ' ' + (isPrimary ? 'primary' : '') + ' ' + (isDanger ? 'danger' : '') + ' ' + (isCompact ? 'compact' : '') + ' ' + (isBorderless ? 'borderless' : '') + ' ' + className}
            style={style}
            type={isSubmit ? 'submit' : 'button'}
            disabled={disabled || isLoading}
            onClick={onClick}
        >
            {isLoading
                ? <LoadingDots size={18} color={isPrimary || isDanger ? 'rgb(255, 255, 255)' : 'var(--color-primary)'} />
                : children}

        </button>
    )
})