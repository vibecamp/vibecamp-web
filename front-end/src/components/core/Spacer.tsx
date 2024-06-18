import React from 'react'

type Props = {
    size: number
}

export default React.memo(({ size }: Props) => {

    return <div style={{ width: size, height: size, flexGrow: 0, flexShrink: 0 }} />
})