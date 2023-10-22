import React from 'react'
import { observer } from 'mobx-react-lite'

type Props = {
    children: React.ReactNode
}

export default observer(({ children }: Props) => {
    return (
        <div className="info-blurb">
            {children}
        </div>
    )
})