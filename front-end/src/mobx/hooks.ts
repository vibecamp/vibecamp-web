import { autorun, computed, makeAutoObservable } from 'mobx'
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
    return useStable(() => makeAutoObservable(init))
}

export function useObservableClass<T extends object>(clazz: new () => T): T {
    const instance = useStable(() => makeAutoObservable(new clazz()))

    useEffect(() => {
        return () => {
            for (const key in instance) {
                const dispose = (instance[key] as any).dispose
                if (typeof dispose === 'function') {
                    dispose()
                }
            }
        }
    }, [instance])

    return instance
}

export function useStable<T>(init: () => T): T {
    const [val] = useState(init)

    useEffect(() => {
        const dispose = (val as any).dispose
        if (typeof dispose === 'function') {
            return dispose
        }
    }, [val])

    return val
}