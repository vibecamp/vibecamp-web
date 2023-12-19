import React from 'react'

import { observer } from '../../mobx/misc'

type Props = {
    size: number
}

export default observer((props: Props) => {

    return <div style={{ width: props.size, height: props.size, flexGrow: 0, flexShrink: 0 }} />
})