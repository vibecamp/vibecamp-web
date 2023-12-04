import { createTransformer } from 'mobx-utils'

export function setter<T, K extends keyof T>(obj: T, key: K) {
    return setterInner(obj)(key)
}

const setterInner = createTransformer(<T, K extends keyof T>(obj: T) =>
    createTransformer((key: K) =>
        (val: T[K]) => {
            obj[key] = val
        }))

export function setTo<T, K extends keyof T>(obj: T, key: K, val: T[K]) {
    return setToInner(obj)(key)(val)
}

const setToInner = createTransformer(<T, K extends keyof T>(obj: T) =>
    createTransformer((key: K) =>
        createTransformer((val: T[K]) =>
            () => {
                obj[key] = val
            })))