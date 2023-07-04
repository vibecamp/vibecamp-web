import React from 'react'
import { observer } from 'mobx-react-lite'

export default observer(({ size }: { size: number }) => {

    return <div style={{ width: size, height: size, flexGrow: 0, flexShrink: 0 }} />
})