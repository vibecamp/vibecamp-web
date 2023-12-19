import React from 'react'

import { observer } from '../../mobx/misc'

export default observer((props: { position: 'top-left' | 'bottom-right' }) => {
    return (
        <div className='stripes-clip'>
            <div className={'stripes' + ' ' + props.position}>
                <div></div>
                <div></div>
                <div></div>
            </div>
        </div>
    )
})