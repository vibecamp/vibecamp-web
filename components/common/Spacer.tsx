import React, { CSSProperties, FC } from 'react'

type Props = {
    size: number
}

const Spacer: FC<Props> = React.memo(({ size }) => {

    return (
        <div
            style={{ '--size': size * 8 + 'px' } as CSSProperties}
        />
    )
})

export default Spacer