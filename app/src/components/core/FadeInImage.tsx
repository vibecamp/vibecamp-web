'use client'

import { type ImgHTMLAttributes, useCallback, useState } from 'react'
import { classNames } from '@/lib/ui'

type Props = ImgHTMLAttributes<HTMLImageElement> & { alt: string }

export default function FadeInImage({ alt, className, ...props }: Props) {
    const [loaded, setLoaded] = useState(false)
    // a cached image can finish before hydration attaches onLoad, so check on mount too
    const ref = useCallback((img: HTMLImageElement | null) => {
        if (img?.complete && img.naturalWidth > 0) setLoaded(true)
    }, [])
    return (
        // biome-ignore lint/performance/noImgElement: served from our own image route with stored dimensions
        <img
            {...props}
            alt={alt}
            ref={ref}
            className={classNames('fade-in-image', loaded && 'loaded', className)}
            onLoad={() => setLoaded(true)}
        />
    )
}
