import React, { CSSProperties } from 'react'
import { observer } from 'mobx-react-lite'
import Spacer from './Spacer'

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
            {children}

            <span className={`loading-container ${isLoading ? 'isLoading' : ''}`}>
                <Spacer size={8} />
                <img src='loading-spinner.gif' width={16}></img>
            </span>
            
        </button>
    )
})