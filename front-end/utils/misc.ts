import { Option } from './types'

export function stringToOption<T extends string>(s: T): Option<T> {
    return { value: s, label: s }
}

export function isClientSide() {
    return typeof window === 'object'
}

export function getQueryParams() {
    if (isClientSide()) {
        const params = new URLSearchParams(window.location.search)
        return Object.fromEntries(params.entries())
    } else {
        return {}
    }
}

export const identityFn = <T,>(x: T) => x

export const doNothingFn = () => { }