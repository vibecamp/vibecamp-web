import { autorun } from 'mobx'
import React from 'react'

import { useObservableClass } from '../../mobx/hooks'
import { observer } from '../../mobx/misc'
import Icon from './Icon'

type Props = {
    isOpen: boolean,
    onClose?: () => void,
    title?: string,
    side: 'left' | 'right',
    children: () => React.ReactNode
}

export default observer((props: Props) => {
    const state = useObservableClass(class {
        modalState: 'closed' | 'opening' | 'open' | 'closing' = props.isOpen ? 'open' : 'closed'

        readonly stateTransitioner = autorun(() => {
            if (props.isOpen) {
                if (this.modalState === 'closed') {
                    this.modalState = 'opening'
                } else if (this.modalState === 'opening') {
                    requestAnimationFrame(() =>
                        this.modalState = 'open')
                }
            } else {
                if (this.modalState === 'open') {
                    this.modalState = 'closing'
                } else if (this.modalState === 'closing') {
                    setTimeout(() => {
                        this.modalState = 'closed'
                    }, 200)
                }
            }
        })
    })

    if (state.modalState === 'closed') {
        return null
    }

    return (
        <div className={'modal' + ' ' + props.side + ' ' + state.modalState}>
            <dialog className='dialog' aria-modal={state.modalState === 'open'}>

                {(props.onClose || props.title) &&
                    <div className='header'>
                        {props.onClose != null &&
                            <button onClick={props.onClose}>
                                <Icon name='arrow_back_ios' />

                                Back
                            </button>}

                        <span className='title'>
                            {props.title}
                        </span>

                        {props.onClose != null &&
                            <span className='balancer'></span>}
                    </div>}

                <div className="content">
                    {props.children()}
                </div>

            </dialog>
        </div>
    )
})