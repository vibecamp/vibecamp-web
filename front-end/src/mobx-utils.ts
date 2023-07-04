import { autorun, observable } from 'mobx'
import { useEffect } from 'react'

// type FormOptions<T extends Record<string, unknown>> = {
//     initialValues: T,
//     validators: { [key in keyof T]: (val: T[key]) => string | undefined },
//     submit: (data: T) => Promise<string | undefined>,
// }

// type FormStore<T extends Record<string, unknown>> = {
//     fields: {
//         [key in keyof T]: {
//             value: T[key],
//             set: (val: T[key]) => void,
//             error: string | undefined,
//             activateValidation: () => void,
//         }
//     },
//     submitting: boolean,
//     error: string | undefined,
//     handleSubmit: (e: FormEvent) => Promise<void>,
// }

// export function form<T extends Record<string, unknown>>(options: FormOptions<T>): FormStore<T> {
//     function handleSubmit(e: FormEvent) {
//         e.preventDefault()


//     }

//     const formStore: FormStore<T> = {
//         fields: Object.fromEntries(Object.keys(options.initialValues).map(key => ({
//             value: options.initialValues[key]
//         })))
//         handleSubmit
//     }

//     return formStore
// }

export function request<T>(fn: () => Promise<T>) {

    let latestRequestId: string | undefined
    async function load() {
        const thisRequestId = latestRequestId = String(Math.random())

        res.state = { kind: 'loading' }

        try {
            const result = await fn()

            if (thisRequestId === latestRequestId) {
                res.state = { kind: 'result', result }
            }
        } catch (error: unknown) {
            if (thisRequestId === latestRequestId) {
                res.state = { kind: 'error', error }
            }
        }
    }

    const res: {
        state: RequestState<T>,
        load: () => Promise<void>,
    } = observable({
        state: { kind: 'idle' },
        load
    })

    autorun(load)

    return res
}

export type RequestState<T> =
    | { readonly kind: 'idle' }
    | { readonly kind: 'loading' }
    | { readonly kind: 'result', readonly result: T }
    | { readonly kind: 'error', readonly error: unknown }

export const windowSize = (() => {
    const size = observable.box({ width: window.innerWidth, height: window.innerHeight })

    window.addEventListener('resize', () => {
        size.set({ width: window.innerWidth, height: window.innerHeight })
    })

    return size
})()

export function useAutorun(fn: () => void) {
    useEffect(() => {
        return autorun(fn)
    })
}