import { type FormEvent, useCallback, useMemo, useState } from 'react'
import type { CommonFieldProps } from '@/components/core/_common'
import { objectEntries } from '@/lib/misc'
import useKeyedMemo from './useKeyedMemo'
import { usePromise } from './usePromise'

export type UseFormInit<T extends Record<string, unknown>> = {
    initial: T
    validators: Partial<{ [Key in keyof T]: (value: T[Key], state: T) => string | undefined }>

    submit: (
        values: T,
        reset: (to?: T) => void,
    ) => Promise<string | undefined | undefined> | string | undefined | undefined
}

export type Form<T extends Record<string, unknown>> = {
    fields: { [Key in keyof T]: Field<T[Key]> }
    values: T
    handleSubmit: (e?: FormEvent<HTMLFormElement>) => void
    submitting: boolean
    wholeFormError: string | undefined
    reset: (to?: T) => void
    dirty: boolean
}

type Field<T> = {
    value: T
    set: (value: T) => void
    error: string | undefined
    activateValidation: () => void
}

type Fields<T> = { [Key in keyof T]: Field<T[Key]> }

export default function useForm<T extends Record<string, unknown>>({
    initial,
    validators,
    submit,
}: UseFormInit<T>): Form<T> {
    const [values, setValues] = useState(initial)
    const [validationActive, setValidationActive] = useState(() => {
        const newObj = {} as Record<keyof T, boolean>
        for (const key in values) {
            newObj[key] = false
        }
        return newObj
    })
    const [dirty, setDirty] = useState(false)

    const fieldInputs = Object.fromEntries(
        objectEntries(values).map(([key, value]) => {
            const error = validationActive[key] ? validators[key]?.(value, values) : undefined
            return [key, [value, error] as const]
        }),
    ) as Record<keyof T & string, readonly [unknown, string | undefined]>
    const fields = useKeyedMemo(fieldInputs, (key, [value, error]) => ({
        value: value as T[typeof key],
        error,
        set: (val: T[typeof key]) => {
            if (value === val) return
            setValues((p) => (p[key] === val ? p : { ...p, [key]: val }))
            setDirty(true)
        },
        activateValidation: () => {
            setValidationActive((p) => (p[key] ? p : { ...p, [key]: true }))
        },
    })) as unknown as Fields<T>

    const reset: Form<T>['reset'] = useCallback(
        (to) => {
            setValues(to ?? initial)
            setDirty(false)
        },
        [initial],
    )

    const submission = usePromise(() => submit(values, reset), [reset, submit, values], {
        lazy: true,
    })

    const handleSubmit = useCallback(
        (event?: { preventDefault?: () => void }) => {
            event?.preventDefault?.()
            setValidationActive((p) => {
                const all = { ...p }
                for (const key in all) all[key] = true
                return all
            })
            const invalid = objectEntries(validators).some(([key, validate]) => {
                const check = validate as
                    | ((value: T[keyof T], state: T) => string | undefined)
                    | undefined
                return check?.(values[key], values) != null
            })
            if (!invalid) void submission.load()
        },
        [submission, validators, values],
    )

    const result: Form<T> = useMemo(
        () => ({
            fields,
            values,
            handleSubmit,
            submitting: submission.state.kind === 'loading',
            wholeFormError: submission.state.result ?? undefined,
            reset,
            dirty,
        }),
        [
            dirty,
            fields,
            handleSubmit,
            reset,
            submission.state.kind,
            submission.state.result,
            values,
        ],
    )

    return result
}

export const fieldToProps = <T>(
    field: Field<T>,
): Pick<CommonFieldProps<T>, 'value' | 'onChange' | 'error' | 'onBlur'> => ({
    value: field.value,
    onChange: field.set,
    error: field.error,
    onBlur: field.activateValidation,
})
