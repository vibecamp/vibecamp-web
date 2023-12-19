import { observer as mobxObserver } from 'mobx-react-lite'
import { createTransformer } from 'mobx-utils'
import React from 'react'

import { useValuesObservable } from './hooks'

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
        (val: T[K]) =>
            () => {
                obj[key] = val
            }))

/**
 * Like `mobx-react-lite`'s `observer()`, but passes props through
 * `useValuesObservable()` before handing them to the component. See the
 * hook's comment for more details.
 */
export const observer = (<P extends object, C extends React.FunctionComponent<P>>(baseComponent: C): C => {
    return mobxObserver((_props: P) => {
        const props = useValuesObservable(_props)
        return baseComponent(props)
    }) as C
}) as typeof mobxObserver