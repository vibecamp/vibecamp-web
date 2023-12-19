import React from 'react'

import { Maybe } from '../../../../back-end/types/misc'
import { useObservableClass } from '../../mobx/hooks'
import { observer } from '../../mobx/misc'
import Icon from '../core/Icon'

type Props = {
    code: string,
    usedBy: Maybe<string>
}

export default observer((props: Props) => {
    const state = useObservableClass(class {
        copied = false

        readonly copy = async () => {
            await navigator.clipboard.writeText(props.code)
            this.copied = true
        }
    })

    return (
        <div className={'invite-code' + ' ' + (props.usedBy != null ? 'used' : '')}>
            <div className='code-widget'>
                <div className='code'>
                    {props.code}
                </div>

                <button onClick={state.copy}>
                    {state.copied
                        ? <Icon name='check' />
                        : <Icon name='content_copy' />}
                </button>
            </div>

            <div className='used-by'>
                {props.usedBy != null && `Used by ${props.usedBy}`}
            </div>
        </div>
    )
})
