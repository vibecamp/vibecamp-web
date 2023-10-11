import React, { CSSProperties } from 'react'
import { observer } from 'mobx-react-lite'

type Props = {
    align?: 'start' | 'center' | 'end' | 'stretch',
    justify?: 'start' | 'center' | 'end' | 'space-between' | 'space-around',
    padding?: CSSProperties['padding'],
    children: React.ReactNode
}

export default observer<Props>(({ align, justify, padding, children }) => {
    return (
        <div className="col" style={{ alignItems: align, justifyContent: justify, padding }}>
            {children}
        </div>
    )
})