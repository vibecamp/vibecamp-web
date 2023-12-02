import React, { CSSProperties } from 'react'
import { observer } from 'mobx-react-lite'
import LoadingDots from './LoadingDots'
import { CommonFieldProps } from './_common'

type Props = Pick<CommonFieldProps<never>, 'disabled'> & {
    onClick?: () => void,
    isSubmit?: boolean,
    isPrimary?: boolean,
    isDanger?: boolean,
    isLoading?: boolean,
    children: React.ReactNode,
    style?: CSSProperties
}

export default observer(({ onClick, isSubmit, isPrimary, isDanger, disabled, isLoading, children, style }: Props) => {

    return (
        <button
            className={'button' + ' ' + (isPrimary ? 'primary' : '') + ' ' + (isDanger ? 'danger' : '')}
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