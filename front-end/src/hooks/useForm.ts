import { FormEvent, useCallback, useMemo, useState } from 'react'

import { CommonFieldProps } from '../components/core/_common'
import { usePromise } from './usePromise'

export type UseFormInit<T extends Record<string, unknown>> = {
    initial: T,
    validators: Partial<{[Key in keyof T]: (value: T[Key], state: T) => string | undefined}>,
    submit: (values: T, reset: (to?: T) => void) => Promise<string | undefined | void> | string | undefined | void
}

export type Form<T extends Record<string, unknown>> = {
    fields: {[Key in keyof T]: Field<T[Key]>},
    handleSubmit: (e: FormEvent<HTMLFormElement>) => void,
    submitting: boolean,
    wholeFormError: string | undefined,
    reset: (to?: T) => void,
    dirty: boolean
}

export type Field<T> = {
    value: T,
    set: (value: T) => void,
    error: string | undefined,
    activateValidation: () => void
}

export type Fields<T> = {[Key in keyof T]: Field<T[Key]>}

export default function useForm<T extends Record<string, unknown>>({ initial, validators, submit }: UseFormInit<T>): Form<T> {
    const [values, setValues] = useState(initial)
    const [validationActive, setValidationActive] = useState(() => {
        const newObj = {} as Record<keyof T, boolean>
        for (const key in values) {
            newObj[key] = false
        }
        return newObj
    })
    const [dirty, setDirty] = useState(false)

    const fields = useMemo(() => {
        const newObj = {} as Fields<T>
        for (const key in values) {
            newObj[key] = {
                value: values[key],
                set: val => {
                    setValues({ ...values, [key]: val })
                    setDirty(true)
                },
                error: validationActive[key] ? validators[key]?.(values[key], values) : undefined,
                activateValidation: () => setValidationActive({ ...validationActive, [key]: true })
            }
        }
        return newObj
    }, [validationActive, validators, values])

    const reset: Form<T>['reset'] = useCallback(to => {
        setValues(to ?? initial)
        setDirty(false)
    }, [initial])

    const submission = usePromise(async () => {
        for (const key in fields) {
            if (fields[key].error != null) {
                return
            }
        }

        return await submit(values, reset)
    }, [fields, reset, submit, values], { lazy: true })

    const handleSubmit = useCallback((event: { preventDefault?: () => void }) => {
        event.preventDefault?.()
        void submission.load()
    }, [submission])

    const result: Form<T> = useMemo(() => ({
        fields,
        handleSubmit,
        submitting: submission.state.kind === 'loading',
        wholeFormError: submission.state.result ?? undefined,
        reset,
        dirty
    }), [dirty, fields, handleSubmit, reset, submission.state.kind, submission.state.result])

    return result
}

// export default function useForm<T extends Record<string, unknown>>(init: UseFormInit<T>): UseFormResult<T> {
//     const [keysStable] = useState(() => Object.keys(init.initial) as Readonly<Array<keyof T>>)

//     // eslint-disable-next-line react-hooks/exhaustive-deps
//     const fields = {} as Fields<T>
//     for (const key of keysStable) {
//         // eslint-disable-next-line react-hooks/rules-of-hooks
//         const [value, setValue] = useState<T[typeof key]>(init.initial[key])
//         // eslint-disable-next-line react-hooks/rules-of-hooks
//         const [validationActive, setValidationActive] = useState(false)
//         // eslint-disable-next-line react-hooks/rules-of-hooks
//         const activateValidation = useCallback(() => setValidationActive(true), [])

//         // eslint-disable-next-line react-hooks/rules-of-hooks
//         fields[key] = useMemo(() => ({
//             value,
//             set: setValue,
//             error: undefined,
//             activateValidation
//         }), [value, activateValidation])
//     }

//     const values = {} as T
//     for (const key of keysStable) {
//         values[key] = fields[key].value
//     }

//     for (const key of keysStable) {
//         const validator = init.validators[key]
//         const rawError = useMemo(() => validator?.(value, values), [validator, value])
//         const error = validationActive ? rawError : undefined
//         fields[key].error = error
//     }

//     const submission = usePromise(async () => {
//         for (const key in fields) {
//             if (fields[key].error != null) {
//                 return
//             }
//         }

//         return await init.submit(values)
//     }, { lazy: true })

//     const result = useMemo(() => ({
//         fields,
//         handleSubmit: preventingDefault(submission.load),
//         submitting: submission.state.kind === 'loading',
//         wholeFormError: submission.state.result
//     }), [fields, submission.load, submission.state.kind, submission.state.result])

//     return result
// }

export const fieldToProps = <T>(field: Field<T>): Pick<CommonFieldProps<T>, 'value' | 'onChange' | 'error' | 'onBlur'> => ({
    value: field.value,
    onChange: field.set,
    error: field.error,
    onBlur: field.activateValidation
})