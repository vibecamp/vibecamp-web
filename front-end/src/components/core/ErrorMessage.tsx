import React from 'react'

import { observer } from '../../mobx/misc'

type Props = {
    error: string | false | undefined
}

export default observer((props: Props) => {
    return (
        <div className={`error-message ${props.error ? 'visible' : ''}`}>
            {props.error}
        </div>
    )
})