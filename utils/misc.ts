import { Option } from './types'

export function stringToOption<T extends string>(s: T): Option<T> {
    return { value: s, label: s }
}

export function isClientSide() {
    return typeof window === 'object'
}