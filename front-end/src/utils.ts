
export function wait(ms: number): Promise<void> {
    return new Promise(res => setTimeout(res, ms))
}

export function given<T, R>(val: T | null | undefined, fn: (val: T) => R): R | null | undefined {
    if (val != null) {
        return fn(val)
    } else {
        return val as null | undefined
    }
}
