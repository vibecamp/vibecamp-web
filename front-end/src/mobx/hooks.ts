import { autorun, computed, makeAutoObservable, makeObservable, observable,Reaction } from 'mobx'
import { useEffect, useState } from 'react'

import { Maybe } from '../../../back-end/types/misc'
import { objectEntries, objectFromEntries, objectKeys } from '../../../back-end/utils/misc'
import { request,RequestObservable } from './request'

export function useStable<T>(init: () => T): T {
    const [val] = useState(init)
    return val
}

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

/**
 * There's an awkward clash between React's reactivity semantics and MobX's
 * semantics:
 * - React wants reaction to happen by forcing a comparison, and then
 *   shallow-comparing values to see if they've changed
 * - MobX does the opposite- it assumes root values ("stores") never change
 *   shallowly, and only observes property *mutations* on observable objects
 *
 * This results in a scenario where if normal React props (or hook results)
 * get referenced in a MobX computation or autorun, changes to them will not
 * be observed
 *
 * To bridge this gap, `useValuesObservable()` takes a set of local "shallow"
 * values that may change in the future, and puts them into an object whose
 * properties are observable by MobX, and then copies them over to that
 * object in an observable way whenever they change shallowly. This helps
 * avoid this class of problem.
 */
export function useValuesObservable<T extends object>(init: T): T {
    const obs = useStable(() => {
        return makeObservable(
            { ...init },
            objectFromEntries(objectKeys(init).map(key => [key, observable.ref] as const)),
        )
    })

    useEffect(() => {
        for (const [key, value] of objectEntries(init)) {
            obs[key] = value
        }
    }, [init, obs])

    return obs
}

export function useObservableClass<T extends object>(clazz: new () => T): T {
    const instance = useStable(() => makeAutoObservable(new clazz()))

    useDisposeAll(instance)

    return instance
}

export function useDisposeAll(obj: Maybe<object>) {
    useEffect(() => {
        return () => {
            disposeAll(obj)
        }
    }, [obj])
}

export const disposeAll = (obj: Maybe<object>) => {
    if (obj != null) {
        for (const key in obj) {
            // @ts-expect-error ___
            const prop = obj[key]
            tryDispose(prop)
        }
    }
}

export const tryDispose = (obj: Maybe<object>) => {
    const dispose = (obj as any)?.dispose
    if (typeof dispose === 'function') {
        dispose()
    }

    if (typeof obj === 'function' && (obj as any).$mobx instanceof Reaction) {
        obj()
    }
}