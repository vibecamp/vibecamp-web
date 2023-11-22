import React, { useEffect, useState } from 'react'
import { observer } from 'mobx-react-lite'
import Icon from './Icon'

type Props = {
    isOpen: boolean,
    onClose?: () => void,
    title?: string,
    side?: 'left' | 'right',
    children: () => React.ReactNode
}

export default observer(({ isOpen, onClose, title, side = 'right', children }: Props) => {
    const [modalState, setModalState] = useState<'closed' | 'opening' | 'open' | 'closing'>(isOpen ? 'open' : 'closed')

    useEffect(() => {
        if (isOpen) {
            if (modalState === 'closed') {
                setModalState('opening')
            } else if (modalState === 'opening') {
                requestAnimationFrame(() =>
                    setModalState('open'))
            }
        } else {
            if (modalState === 'open') {
                setModalState('closing')
            } else if (modalState === 'closing') {
                setTimeout(() => {
                    setModalState('closed')
                }, 200)
            }
        }
    }, [isOpen, modalState])

    if (modalState === 'closed') {
        return null
    }

    return (
        <div className={'modal' + ' ' + side + ' ' + modalState}>
            <dialog className='dialog' aria-modal={modalState === 'open'}>

                {(onClose || title) &&
                    <div className='header'>
                        {onClose != null &&
                            <button onClick={onClose}>
                                <Icon name='arrow_back_ios' />

                                Back
                            </button>}

                        <span className='title'>
                            {title}
                        </span>

                        {onClose != null &&
                            <span className='balancer'></span>}
                    </div>}

                <div className="content">
                    {children()}
                </div>

            </dialog>
        </div>
    )
})