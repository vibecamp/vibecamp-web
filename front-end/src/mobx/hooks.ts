import { autorun, computed, observable } from 'mobx'
import { useEffect, useState } from 'react'
import { RequestObservable, request } from './request'

export function useAutorun(fn: () => void) {
    useEffect(() => {
        return autorun(fn)
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])
}

export function useComputed<T>(fn: () => T): T {
    return useStable(() => computed(fn)).get()
}

export function useRequest<T>(fn: () => Promise<T>, options: { lazy?: boolean } = {}): RequestObservable<T> {
    return useStable(() => request(fn, options))
}

export function useRequestWithDependencies<T>(fn: () => Promise<T>, deps?: unknown[], options: { lazy?: boolean } = {}): RequestObservable<T> {
    const [req, setReq] = useState(() => request(fn, options))

    useEffect(() => {
        const r = request(fn, options)
        setReq(r)
        return r.dispose
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, deps)

    return req
}

export function useObservableState<T extends Record<string, unknown>>(init: T): T {
    return useStable(() => observable(init))
}

export function useStable<T>(init: () => T): T {
    const [val] = useState(init)

    useEffect(() => {
        const disposer = (val as any).dispose
        if (typeof disposer === 'function') {
            return disposer
        }
    }, [val])

    return val
}