import React, { CSSProperties } from 'react'

import { observer } from '../../mobx/misc'

type Props = {
    align?: 'start' | 'center' | 'end' | 'stretch',
    justify?: 'start' | 'center' | 'end' | 'space-between' | 'space-around',
    padding?: CSSProperties['padding'],
    pageLevel?: boolean,
    children: React.ReactNode
}

export default observer((props: Props) => {
    return (
        <div
            className={`col ${props.pageLevel ? 'page-level' : ''}`}
            style={{ alignItems: props.align, justifyContent: props.justify, padding: props.padding }}
        >
            {props.children}
        </div>
    )
})