import { useRef } from 'react'

export default function useKeyedMemo<K extends string, D extends readonly unknown[], V>(
    inputs: Record<K, D>,
    compute: (key: K, deps: D) => V,
): Record<K, V> {
    const cacheRef = useRef(new Map<K, { deps: D; value: V }>())
    const cache = cacheRef.current
    const result = {} as Record<K, V>
    const seen = new Set<K>()

    for (const key in inputs) {
        seen.add(key)
        const deps = inputs[key]
        const prev = cache.get(key)
        if (prev != null && depsEqual(prev.deps, deps)) {
            result[key] = prev.value
        } else {
            const value = compute(key, deps)
            cache.set(key, { deps, value })
            result[key] = value
        }
    }

    for (const key of cache.keys()) {
        if (!seen.has(key)) cache.delete(key)
    }

    return result
}

function depsEqual(a: readonly unknown[], b: readonly unknown[]) {
    if (a.length !== b.length) return false
    for (let i = 0; i < a.length; i++) {
        if (!Object.is(a[i], b[i])) return false
    }
    return true
}
