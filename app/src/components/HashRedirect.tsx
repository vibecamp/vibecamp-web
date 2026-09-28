'use client'

import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { hashToPath } from '@/lib/hash-redirect'

export default function HashRedirect() {
    const router = useRouter()

    useEffect(() => {
        const path = hashToPath(window.location.hash)
        if (path != null) {
            router.replace(path)
        }
    }, [router])

    return null
}
