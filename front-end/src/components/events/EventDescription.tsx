import React from 'react'

import { urlsToLinks } from '../../utils'

export default React.memo(({ description }: { description: string }) => {
    return (
        <pre>
            {urlsToLinks(description)}
        </pre>
    )
})

