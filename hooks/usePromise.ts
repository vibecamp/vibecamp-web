import { useState, useEffect, useRef, useCallback } from "react"

export function usePromise<T>(fn: () => Promise<T> | T): UsePromiseState<T> {
    const [invoke, state] = usePromiseLazy(fn)

    useEffect(() => {
        invoke()
    }, [invoke])

    return (
        state.kind === 'unsent'
            ? { kind: 'loading' }
            : state
    )
}

export function usePromiseLazy<T>(fn: () => Promise<T> | T) {
    const [state, setState] = useState<UsePromiseLazyState<T>>({ kind: 'unsent' })
    const lastRequestId = useRef<string | undefined>(undefined)

    const invoke = useCallback(() => {
        const closureId = lastRequestId.current = String(Math.random())

        try {
            setState({ kind: 'loading' })
            const res = fn()

            if (res instanceof Promise) {
                res
                    .then((value: T) => {
                        if (closureId === lastRequestId.current) {
                            setState({ kind: 'value', value })
                        }
                    })
                    .catch((error: unknown) => {
                        if (closureId === lastRequestId.current) {
                            setState({ kind: 'error', error })
                        }
                    })
            } else {
                setState({ kind: 'value', value: res })
            }
        } catch (error) {
            if (closureId === lastRequestId.current) {
                setState({ kind: 'error', error })
            }
        }
    }, [fn])

    return [invoke, state] as const
}

type UsePromiseState<T> =
    | { kind: 'value', value: T }
    | { kind: 'error', error: unknown }
    | { kind: 'loading' }


type UsePromiseLazyState<T> =
    | UsePromiseState<T>
    | { kind: 'unsent' }