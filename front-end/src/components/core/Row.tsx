import React from 'react'
import { observer } from 'mobx-react-lite'

type Props = {
    align?: 'start' | 'center' | 'end' | 'stretch',
    justify?: 'start' | 'center' | 'end' | 'space-between' | 'space-around',
    children: React.ReactNode
}

export default observer<Props>(({ align, justify, children }) => {
    return (
        <div className="row" style={{ alignItems: align, justifyContent: justify }}>
            {children}
        </div>
    )
})