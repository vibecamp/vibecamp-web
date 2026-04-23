import React, { AnchorHTMLAttributes, HTMLAttributeAnchorTarget } from 'react'

import { buttonClassName,ButtonStyleProps } from './Button'

type Props = ButtonStyleProps & Pick<AnchorHTMLAttributes<HTMLAttributeAnchorTarget>, 'href' | 'target'| 'rel'>

export default React.memo((props: Props) => {
    const { href, target, rel, style, children } = props

    return (
        <a
            className={buttonClassName(props)}
            style={style}
            href={href}
            target={target}
            rel={rel}
        >
            {children}
        </a>
    )
})
