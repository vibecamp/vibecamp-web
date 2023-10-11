import React from 'react'
import { observer } from 'mobx-react-lite'

export default observer(({ position }: { position: 'top-left' | 'bottom-right' }) => {
    return (
        <div className={'stripes' + ' ' + position}>
            <div></div>
            <div></div>
            <div></div>
        </div>
    )
})