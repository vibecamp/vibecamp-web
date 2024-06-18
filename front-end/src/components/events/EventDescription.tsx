import React, { ReactNode } from 'react'

export default React.memo(({ description }: { description: string }) => {
    const descriptionSegments: ReactNode[] = []
    const urlRegex = /(?:http|https):\/\/([\w_-]+(?:(?:\.[\w_-]+)+))(?:[\w.,@?^=%&:/~+#-]*[\w@?^=%&/~+#-])/igm
    let result: RegExpExecArray | null = null
    let lastIndex = 0
    // eslint-disable-next-line no-cond-assign
    while (result = urlRegex.exec(description)) {
        descriptionSegments.push(description.substring(lastIndex, result.index))
        const url = result[0]
        descriptionSegments.push(<a href={url} target='_blank' rel="noreferrer" key={result.index}>{url}</a>)
        lastIndex = result.index + url.length
    }

    descriptionSegments.push(description.substring(lastIndex))

    return (
        <pre>
            {descriptionSegments}
        </pre>
    )
})
