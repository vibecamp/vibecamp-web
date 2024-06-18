import React, { CSSProperties } from 'react'

type Props = {
    align?: 'start' | 'center' | 'end' | 'stretch',
    justify?: 'start' | 'center' | 'end' | 'space-between' | 'space-around',
    padding?: CSSProperties['padding'],
    children: React.ReactNode
}

export default React.memo(({ padding, align, justify, children }: Props) => {
    return (
        <div className="row" style={{ alignItems: align, justifyContent: justify, padding: padding }}>
            {children}
        </div>
    )
})