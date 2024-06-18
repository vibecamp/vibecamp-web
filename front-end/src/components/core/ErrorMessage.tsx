import React from 'react'

type Props = {
    error: string | false | undefined
}

export default React.memo(({ error }: Props) => {
    return (
        <div className={`error-message ${error ? 'visible' : ''}`}>
            {error}
        </div>
    )
})