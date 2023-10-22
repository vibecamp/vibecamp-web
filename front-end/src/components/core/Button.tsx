import React, { CSSProperties } from 'react'
import { observer } from 'mobx-react-lite'
import Spacer from './Spacer'
import LoadingDots from './LoadingDots'

type Props = {
    onClick?: () => void,
    isSubmit?: boolean,
    isPrimary?: boolean,
    isDanger?: boolean,
    isDisabled?: boolean,
    isLoading?: boolean,
    children: React.ReactNode,
    style?: CSSProperties
}

export default observer(({ onClick, isSubmit, isPrimary, isDanger, isDisabled, isLoading, children, style }: Props) => {

    return (
        <button 
            className={'button' + ' ' + (isPrimary ? 'primary' : '') + ' ' + (isDanger ? 'danger' : '')}
            style={style} 
            type={isSubmit ? 'submit' : 'button'}
            disabled={isDisabled || isLoading}
            onClick={onClick}
        >
            {isLoading
                ? <LoadingDots size={18} color={isPrimary || isDanger ? 'rgb(255, 255, 255)' : 'var(--color-primary)'} />
                : children}

        </button>
    )
})