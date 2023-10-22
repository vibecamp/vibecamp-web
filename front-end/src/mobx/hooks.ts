import { autorun, computed, observable } from 'mobx'
import { useEffect, useState } from 'react'
import { RequestObservable, request } from './request'

export function useAutorun(fn: () => void) {
    useEffect(() => {
        return autorun(fn)
    })
}

export function useComputed<T>(fn: () => T): T {
    return useStable(() => computed(fn)).get()
}

export function useRequest<T>(fn: () => Promise<T>, options: { lazy?: boolean } = {}): RequestObservable<T> {
    const req = useStable(() => request(fn, options))

    useEffect(() => {
        return req.dispose
    })

    return req
}

export function useRequestWithDependencies<T>(fn: () => Promise<T>, deps?: unknown[], options: { lazy?: boolean } = {}): RequestObservable<T> {
    const req = useStable(() => request(fn, options))

    useEffect(() => {
        return req.dispose
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, deps)

    return req
}

export function useObservableState<T extends Record<string, unknown>>(init: T): T {
    return useStable(() => observable(init))
}

export function useStable<T>(init: () => T): T {
    const [val] = useState(init)
    return val
}