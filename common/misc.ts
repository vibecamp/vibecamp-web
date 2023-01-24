
export function exists<T>(val: T | null | undefined): val is T {
    return val != null
}