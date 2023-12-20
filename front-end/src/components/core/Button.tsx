import React, { CSSProperties } from 'react'

import { observer } from '../../mobx/misc'
import { CommonFieldProps } from './_common'
import LoadingDots from './LoadingDots'

type Props = Pick<CommonFieldProps<never>, 'disabled'> & {
    onClick?: () => void,
    isSubmit?: boolean,
    isPrimary?: boolean,
    isDanger?: boolean,
    isLoading?: boolean,
    isCompact?: boolean,
    children: React.ReactNode,
    style?: CSSProperties
}

export default observer((props: Props) => {

    return (
        <button
            className={'button' + ' ' + (props.isPrimary ? 'primary' : '') + ' ' + (props.isDanger ? 'danger' : '') + ' ' + (props.isCompact ? 'compact' : '')}
            style={props.style}
            type={props.isSubmit ? 'submit' : 'button'}
            disabled={props.disabled || props.isLoading}
            onClick={props.onClick}
        >
            {props.isLoading
                ? <LoadingDots size={18} color={props.isPrimary || props.isDanger ? 'rgb(255, 255, 255)' : 'var(--color-primary)'} />
                : props.children}

        </button>
    )
})