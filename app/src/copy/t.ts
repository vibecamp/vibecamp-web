import { COPY, type CopyKey } from './catalog'

export function t<K extends CopyKey>(key: K): (typeof COPY)[K] {
    return COPY[key]
}
