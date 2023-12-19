import React, { CSSProperties } from 'react'

import { observer } from '../../mobx/misc'

type Props = {
    size: number,
    color: string
}

export default observer((props: Props) => {
    return (
        <div className="loading-dots" style={{ '--size': props.size + 'px', '--dot-color': props.color } as CSSProperties}>
            <div className='spinner'>
                <div></div>
                <div></div>
                <div></div>
                <div></div>
            </div>
        </div>
    )
})