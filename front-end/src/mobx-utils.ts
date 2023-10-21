import { IReactionDisposer, autorun, computed, observable } from 'mobx'
import { useEffect, useState } from 'react'

export const DEFAULT_FORM_ERROR = 'Something went wrong, please try again'

type RequestObservable<T> = {
    state: RequestState<T>
    load: () => void
    dispose: () => void
}

export type RequestState<T> =
    | { readonly kind: 'idle', readonly result: undefined }
    | { readonly kind: 'loading', readonly result: undefined }
    | { readonly kind: 'result', readonly result: T }
    | { readonly kind: 'error', readonly result: undefined, readonly error: unknown }

export function request<T>(fn: () => Promise<T>, { lazy }: { lazy?: boolean } = {}): RequestObservable<T> {
    let latestRequestId: string | undefined
    async function load() {
        const thisRequestId = latestRequestId = String(Math.random())

        res.state = { kind: 'loading', result: undefined }

        try {
            const result = await fn()

            if (thisRequestId === latestRequestId) {
                res.state = { kind: 'result', result }
            }
        } catch (error: unknown) {
            if (thisRequestId === latestRequestId) {
                res.state = { kind: 'error', error, result: undefined }
                console.error(error)
            }
        }

        return res.state
    }

    let autorunDisposer: IReactionDisposer | undefined
    const res: RequestObservable<T> = observable({
        state: { kind: 'idle', result: undefined },
        load: (
            lazy
                ? () => {
                    if (autorunDisposer == null) {
                        autorunDisposer = autorun(load)
                    } else {
                        return load()
                    }
                }
                : load
        ),
        dispose: () => {
            autorunDisposer?.()
        }
    })

    if (!lazy) {
        autorunDisposer = autorun(load)
    }

    return res
}

export const windowSize = (() => {
    const size = observable.box({ width: window.innerWidth, height: window.innerHeight })

    window.addEventListener('resize', () => {
        size.set({ width: window.innerWidth, height: window.innerHeight })
    })

    return size
})()

export function useAutorun(fn: () => void) {
    useEffect(() => {
        return autorun(fn)
    })
}

export function useComputed<T>(fn: () => T): T {
    const [comp] = useState(() => computed(fn))
    return comp.get()
}

export function useRequest<T>(fn: () => Promise<T>, options: { lazy?: boolean } = {}): RequestObservable<T> {
    const [req] = useState(() => request(fn, options))

    useEffect(() => {
        return req.dispose
    })

    return req
}

export function useRequestWithDependencies<T>(fn: () => Promise<T>, deps?: unknown[], options: { lazy?: boolean } = {}): RequestObservable<T> {
    const [req] = useState(() => request(fn, options))

    useEffect(() => {
        return req.dispose
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, deps)

    return req
}

export function useObservableState<T extends Record<string, unknown>>(init: T): T {
    const [obs] = useState(() => observable(init))
    return obs
}
