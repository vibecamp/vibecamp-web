import React, { CSSProperties } from 'react'

type Props = {
    align?: 'start' | 'center' | 'end' | 'stretch',
    justify?: 'start' | 'center' | 'end' | 'space-between' | 'space-around',
    padding?: CSSProperties['padding'],
    pageLevel?: boolean,
    children: React.ReactNode
}

export default React.memo(({ pageLevel, padding, align, justify, children }: Props) => {
    return (
        <div
            className={`col ${pageLevel ? 'page-level' : ''}`}
            style={{ alignItems: align, justifyContent: justify, padding: padding }}
        >
            {children}
        </div>
    )
})