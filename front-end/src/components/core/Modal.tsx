import React from 'react'
import { observer } from 'mobx-react-lite'

type Props = {
    isOpen: boolean,
    onClose?: () => void,
    title?: string,
    side?: 'left' | 'right',
    children: React.ReactNode
}

export default observer(({ isOpen, onClose, title, side = 'right', children }: Props) => {

    return (
        <div className={'modal' + ' ' + (isOpen ? 'open' : '') + ' ' + side}>
            <div className='dialog'>
                {(onClose || title) &&
                    <div className='header'>
                        {onClose != null &&
                            <button onClick={onClose}>
                                <span className="material-symbols-outlined">
                                    arrow_back_ios
                                </span>

                                Back
                            </button>}
                        
                        <span className='title'>
                            {title}
                        </span>
                        
                        {onClose != null &&
                            <span className='balancer'></span>}
                    </div>}
                <div className="content">
                    {children}
                </div>
            </div>
        </div>
    )
})