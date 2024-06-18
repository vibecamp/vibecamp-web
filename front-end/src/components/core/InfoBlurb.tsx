import React from 'react'

type Props = {
    children: React.ReactNode
}

export default React.memo(({ children }: Props) => {
    return (
        <div className="info-blurb">
            {children}
        </div>
    )
})