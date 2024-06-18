import React from 'react'

import Spacer from './core/Spacer'

export default React.memo(() => {

    return (
        <>
            <h1>Announcements</h1>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <Spacer size={500} />
                {/* <LoadingDots /> */}
            </div>
        </>
    )
})