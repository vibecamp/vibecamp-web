import { useEffect } from 'react'
import useBooleanState from './useBooleanState'
import useWindowEvent from './useWindowEvent'

export default function useIsOffline() {
    const { state: isOffline, setTrue, setFalse } = useBooleanState(false)

    useEffect(() => {
        if (!navigator.onLine) {
            setTrue()
        }
    }, [setTrue])

    useWindowEvent('offline', setTrue)
    useWindowEvent('online', setFalse)

    return isOffline
}
