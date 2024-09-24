import { useCallback, useState } from 'react'

export default function useBooleanState(init: boolean) {
    const [state, setState] = useState(init)
    const setTrue = useCallback(() => setState(true), [])
    const setFalse = useCallback(() => setState(false), [])
    const toggle = useCallback(() => setState(s => !s), [])

    return { state, setTrue, setFalse, toggle }
}