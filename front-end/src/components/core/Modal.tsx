import React from 'react'
import { observer } from 'mobx-react-lite'

type Props = {
    isOpen: boolean,
    onBackdropClick: () => void,
    children: React.ReactNode
}

export default observer(({ isOpen, onBackdropClick, children }: Props) => {

    return (
        <div className={'modal' + ' ' + (isOpen ? 'open' : '')} onClick={onBackdropClick}>
            <div onClick={stopPropagation}>
                {children}
            </div>
        </div>
    )
})

function stopPropagation(e: React.UIEvent) {
    e.stopPropagation()
}