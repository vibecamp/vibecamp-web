'use client'

import { useEffect } from 'react'
import { hashToPath } from '@/lib/hash-redirect'
import { useNav } from './NavStack'

export default function HashRedirect() {
    const { replace } = useNav()

    useEffect(() => {
        const path = hashToPath(window.location.hash)
        if (path != null) {
            replace(path)
        }
    }, [replace])

    return null
}
