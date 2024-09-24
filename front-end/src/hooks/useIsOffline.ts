
import useBooleanState from './useBooleanState'
import useWindowEvent from './useWindowEvent'

export default function useIsOffline() {
    const { state: isOffline, setTrue, setFalse } = useBooleanState(!navigator.onLine)

    useWindowEvent('offline', setTrue)
    useWindowEvent('online', setFalse)

    return isOffline
}