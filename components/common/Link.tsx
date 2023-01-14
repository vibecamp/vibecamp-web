import React, { CSSProperties, FC, ReactNode, useMemo } from "react";
import NextLink from 'next/link'

export type Props = {
    className?: string,
    style?: CSSProperties,
    href: string,
    children: ReactNode,
    openInNewTab?: boolean,
}

const Link: FC<Props> = React.memo(({ className, style, href, children, openInNewTab }) => {
    const linkProps = useMemo(() => ({
        className,
        style,
        href,
        target: openInNewTab ? '_blank' : undefined,
        rel: openInNewTab ? 'noreferrer' : undefined,
        children
    } as const), [children, className, href, openInNewTab, style])

    if (href.startsWith('/') && !openInNewTab) {
        return (
            <NextLink {...linkProps} />
        )
    } else {
        return (
            <a {...linkProps} />
        )
    }
})



export default Link