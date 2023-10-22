import React, { CSSProperties } from 'react'
import { observer } from 'mobx-react-lite'

type Props = {
    size: number,
    color: string
}

export default observer(({ size, color }: Props) => {
    return (
        <div className="loading-dots" style={{ '--size': size + 'px', '--dot-color': color } as CSSProperties}>
            <div className='spinner'>
                <div></div>
                <div></div>
                <div></div>
                <div></div>
            </div>
        </div>
    )
})