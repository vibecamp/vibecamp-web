import React, { CSSProperties } from 'react'
import { observer } from 'mobx-react-lite'

type Props = {
    onClick?: () => void,
    isSubmit?: boolean,
    isPrimary?: boolean,
    isLoading?: boolean,
    children: React.ReactNode,
    style?: CSSProperties
}

export default observer(({ onClick, isSubmit, isPrimary, isLoading, children, style }: Props) => {

    return (
        <button className={'button' + ' ' + (isPrimary ? 'primary' : '')} style={style} type={isSubmit ? 'submit' : 'button'} onClick={onClick}>
            {children}
        </button>
    )
})