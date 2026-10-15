'use client'

import { usePathname } from 'next/navigation'
import { useLayoutEffect, useRef } from 'react'

const depth = (path: string) => path.split('/').filter(Boolean).length

export default function NavDirection() {
    const pathname = usePathname()
    const previous = useRef(pathname)

    useLayoutEffect(() => {
        const from = depth(previous.current)
        const to = depth(pathname)
        document.documentElement.dataset.nav = to > from ? 'forward' : to < from ? 'back' : 'same'
        previous.current = pathname
    }, [pathname])

    return null
}
