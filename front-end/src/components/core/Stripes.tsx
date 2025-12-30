import React from 'react'

export default React.memo(({ position }: { position: 'top-left' | 'bottom-right' }) => {
    return (
        <div className='stripes-clip'>
            <div className={'stripes' + ' ' + position}>
                <div />
                <div />
                <div />
            </div>
        </div>
    )
})