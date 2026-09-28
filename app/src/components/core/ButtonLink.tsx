import Link from 'next/link'
import type { AnchorHTMLAttributes } from 'react'
import { type ButtonStyleProps, buttonClassName } from './Button'

type Props = ButtonStyleProps &
    Pick<AnchorHTMLAttributes<HTMLAnchorElement>, 'href' | 'target' | 'rel'>

export default function ButtonLink(props: Props) {
    const { href, target, rel, style, children } = props
    const className = buttonClassName(props)

    if (href?.startsWith('/')) {
        return (
            <Link className={className} style={style} href={href} target={target} rel={rel}>
                {children}
            </Link>
        )
    }

    return (
        <a className={className} style={style} href={href} target={target} rel={rel}>
            {children}
        </a>
    )
}
