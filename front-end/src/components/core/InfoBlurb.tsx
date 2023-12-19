import React from 'react'

import { observer } from '../../mobx/misc'

type Props = {
    children: React.ReactNode
}

export default observer((props: Props) => {
    return (
        <div className="info-blurb">
            {props.children}
        </div>
    )
})