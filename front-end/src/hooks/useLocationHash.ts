import { useCallback, useState } from 'react'

import { useWindowEvent } from './utils'

export default function useLocationHash() {
    const [hash, setHash] = useState(window.location.hash)
    const updateHash = useCallback(() => setHash(window.location.hash), [])

    useWindowEvent('hashchange', updateHash)

    return hash
}
