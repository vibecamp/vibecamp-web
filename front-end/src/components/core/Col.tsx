import React, { CSSProperties } from 'react'
import { observer } from 'mobx-react-lite'

type Props = {
    align?: 'start' | 'center' | 'end' | 'stretch',
    justify?: 'start' | 'center' | 'end' | 'space-between' | 'space-around',
    padding?: CSSProperties['padding'],
    pageLevel?: boolean,
    children: React.ReactNode
}

export default observer<Props>(({ align, justify, padding, pageLevel, children }) => {
    return (
        <div className={`col ${pageLevel ? 'page-level' : ''}`} style={{ alignItems: align, justifyContent: justify, padding }}>
            {children}
        </div>
    )
})