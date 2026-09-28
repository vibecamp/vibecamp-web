import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

type UsePromiseResult<T> = {
    state: RequestState<T>
    load: () => Promise<void>
}

type MutableRequestState<T> =
    | { kind: 'idle'; result: Readonly<T> | undefined; error: undefined }
    | { kind: 'loading'; result: Readonly<T> | undefined; error: undefined }
    | { kind: 'result'; result: Readonly<T>; error: undefined }
    | { kind: 'error'; result: Readonly<T> | undefined; error: unknown }

type RequestState<T> = Readonly<MutableRequestState<T>>

const IDLE_STATE = { kind: 'idle', result: undefined, error: undefined } as const
const LOADING_STATE = { kind: 'loading', result: undefined, error: undefined } as const

export function usePromise<T>(
    fn: () => Promise<T> | T,
    deps: readonly unknown[],
    { lazy }: { lazy?: boolean } = {},
): UsePromiseResult<T> {
    // biome-ignore lint/correctness/useExhaustiveDependencies: the caller supplies the dependency list, exactly as with useCallback itself
    const request = useCallback(fn, deps)

    const [state, setState] = useState<RequestState<T>>(lazy ? IDLE_STATE : LOADING_STATE)

    const [stateRequest, setStateRequest] = useState(() => request)

    const latestRequestId = useRef<string | undefined>(undefined)
    const load = useCallback(async () => {
        const thisRequestId = String(Math.random())
        latestRequestId.current = thisRequestId

        setStateRequest(() => request)
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

    const currentState: RequestState<T> = !lazy && stateRequest !== request ? LOADING_STATE : state

    return useMemo(() => ({ state: currentState, load }), [currentState, load])
}
