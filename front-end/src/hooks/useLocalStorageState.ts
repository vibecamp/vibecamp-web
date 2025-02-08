import { useEffect, useState } from 'react'

type UseStateResult<T> = ReturnType<typeof useState<T>>

export function useLocalStorageState<T>(key: string): UseStateResult<T | undefined>;
export function useLocalStorageState<T>(key: string, defaultValue: T): UseStateResult<T>;
export function useLocalStorageState<T>(key: string, defaultValue?: T) {
    const [state, setState] = useState(() => {
        const storedStr = localStorage.getItem(key)
        if (storedStr) {
            const parsed = JSON.parse(storedStr) as T
            return parsed
        } else {
            return defaultValue
        }
    })

    useEffect(() => {
        localStorage.setItem(key, JSON.stringify(state))
    }, [key, state])

    return [state, setState]
}