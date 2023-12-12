import React from 'react'
import { observer } from 'mobx-react-lite'

type Props = {
    error: string | false | undefined
}

export default observer(({ error }: Props) => {
    return (
        <div className={`error-message ${error ? 'visible' : ''}`}>
            {error}
        </div>
    )
})