import React from 'react'
import { observer } from 'mobx-react-lite'

type Props = {
    error: string | undefined
}

export default observer(({ error }: Props) => {
    return (
        <div className={`error-message ${error != null ? 'visible' : ''}`}>
            {error}
        </div>
    )
})