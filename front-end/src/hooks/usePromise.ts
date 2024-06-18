import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

export type UsePromiseResult<T> = {
    state: RequestState<T>
    load: () => Promise<void>
}

type MutableRequestState<T> =
    | { kind: 'idle', result: Readonly<T> | undefined, error: undefined }
    | { kind: 'loading', result: Readonly<T> | undefined, error: undefined}
    | { kind: 'result', result: Readonly<T>, error: undefined }
    | { kind: 'error', result: Readonly<T> | undefined, error: unknown }

export type RequestState<T> = Readonly<MutableRequestState<T>>

const IDLE_STATE = { kind: 'idle', result: undefined, error: undefined } as const
const LOADING_STATE = { kind: 'loading', result: undefined, error: undefined } as const

/**
 * Observable MobX abstraction around an async function (usually but not
 * necessarily an API request). Exposes loading/error/response state,
 * and allows triggering a re-fetch.
 *
 * By default it will trigger the request automatically when created, and
 * re-run it if any observed values change. If `{ lazy: true }` is passed,
 * it will only be triggered when `load()` is called.
 */
export function usePromise<T>(fn: () => Promise<T> | T, deps: readonly unknown[], { lazy }: { lazy?: boolean } = {}): UsePromiseResult<T> {
    // eslint-disable-next-line react-hooks/exhaustive-deps
    const request = useCallback(fn, deps)

    const [state, setState] = useState<RequestState<T>>(
        lazy
            ? IDLE_STATE
            : LOADING_STATE
    )

    const latestRequestId = useRef<string | undefined>(undefined)
    const load = useCallback(async () => {
        const thisRequestId = latestRequestId.current = String(Math.random())

        setState(LOADING_STATE)

        try {
            const result = await request()

            if (thisRequestId === latestRequestId.current) {
                setState({ kind: 'result', result, error: undefined })
            }
        } catch (error: unknown) {
            if (thisRequestId === latestRequestId.current) {
                setState({ kind: 'error', result: undefined, error })
                console.error(error)
            }
        }
    }, [request])

    useEffect(() => {
        if (!lazy) {
            void load()
        }
    }, [lazy, load])

    const res = useMemo(() => ({ state, load }), [state, load])

    return res
}