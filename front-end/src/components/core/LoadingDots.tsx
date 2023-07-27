import React from 'react'
import { observer } from 'mobx-react-lite'

export default observer(() => {
    return (
        <div className="loading-dots">
            <div></div>
            <div></div>
            <div></div>
        </div>
    )
})