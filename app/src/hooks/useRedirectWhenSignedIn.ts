'use client'

import { useEffect } from 'react'
import { useNav } from '@/components/NavStack'
import useNextPath from './useNextPath'
import { useStore } from './useStore'

export default function useRedirectWhenSignedIn(): string {
    const store = useStore()
    const { leaveExcluded } = useNav()
    const next = useNextPath()

    useEffect(() => {
        if (store.ready && store.loggedIn) {
            leaveExcluded(next)
        }
    }, [leaveExcluded, next, store.loggedIn, store.ready])

    return next
}
