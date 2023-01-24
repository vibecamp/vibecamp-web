import React, { CSSProperties, FC } from 'react'
import styles from './Spacer.module.scss'

type Props = {
    size: number
}

const Spacer: FC<Props> = React.memo(({ size }) => {

    return (
        <div
            className={styles.component}
            style={{ '--size': size * 8 + 'px' } as CSSProperties}
        />
    )
})

export default Spacer