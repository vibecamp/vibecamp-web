'use client'

import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import PageLoading from '@/components/PageLoading'
import { hashToPath } from '@/lib/hash-redirect'
import { DEFAULT_PATH } from '@/lib/routes'

export default function RootPage() {
    const router = useRouter()

    useEffect(() => {
        router.replace(hashToPath(window.location.hash) ?? DEFAULT_PATH)
    }, [router])

    return <PageLoading />
}
