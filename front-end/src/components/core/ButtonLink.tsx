import React, { AnchorHTMLAttributes, HTMLAttributeAnchorTarget } from 'react'

import { buttonClassName,ButtonStyleProps } from './Button'

type Props = ButtonStyleProps & Pick<AnchorHTMLAttributes<HTMLAttributeAnchorTarget>, 'href' | 'target'| 'rel' | 'download'>

export default React.memo((props: Props) => {
    const { href, target, rel, download, style, children } = props

    return (
        <a
            className={buttonClassName(props)}
            style={style}
            href={href}
            target={target}
            rel={rel}
            download={download}
        >
            {children}
        </a>
    )
})
