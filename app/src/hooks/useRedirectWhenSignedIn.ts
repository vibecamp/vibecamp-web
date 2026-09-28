'use client'

import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import useNextPath from './useNextPath'
import { useStore } from './useStore'

export default function useRedirectWhenSignedIn(): string {
    const store = useStore()
    const router = useRouter()
    const next = useNextPath()

    useEffect(() => {
        if (store.ready && store.loggedIn) {
            router.replace(next)
        }
    }, [next, router, store.loggedIn, store.ready])

    return next
}
