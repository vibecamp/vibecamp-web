import { IReactionDisposer, action, autorun, makeAutoObservable, observable } from 'mobx'
import { FormEvent, useEffect, useState } from 'react'

type FormOptions<T extends Record<string, unknown>> = {
    initialValues: T,
    validators: Partial<{ [key in keyof T]: (val: T[key]) => string | undefined }>,
    submit: (data: T) => Promise<string | undefined | void>,
}

export const DEFAULT_FORM_ERROR = 'Something went wrong, please try again'

export function form<TValues extends Record<string, unknown>>(opts: FormOptions<TValues>): ObservableForm<TValues> {
    return new Form(opts)
}

export type ObservableForm<TValues extends Record<string, unknown>> = {
    readonly fields: {
        readonly [key in keyof TValues]: {
            readonly value: TValues[key],
            readonly set: (val: TValues[key]) => void,
            readonly error: string | undefined,
            readonly activateValidation: () => void
        }
    },
    readonly submitting: boolean,
    readonly error: string | undefined,
    readonly handleSubmit: (e: FormEvent) => Promise<void>
}

// TODO: Handle updating submit() closure after initialization

class Form<TValues extends Record<string, unknown>> {
    constructor(
        opts: FormOptions<TValues>
    ) {
        {
            const fields = {} as {
                [key in keyof TValues]: Field<TValues[key]>
            }
            for (const key in opts.initialValues) {
                fields[key] = new Field(opts.initialValues[key], opts.validators[key])
            }
            this.fields = fields
        }

        const submit = action(opts.submit)

        this.handleSubmit = async (e: FormEvent) => {
            e.preventDefault()

            this.error = undefined

            let fieldError = false
            for (const key in this.fields) {
                this.fields[key].activateValidation()
                if (this.fields[key].rawError != null) {
                    fieldError = true
                }
            }

            if (fieldError) {
                return
            }

            try {
                this.submitting = true
                this.error = (await submit(this.fieldValues)) ?? undefined
                this.submitting = false
            } catch {
                this.error = DEFAULT_FORM_ERROR
            }
        }

        makeAutoObservable(this)
    }

    fields: {
        readonly [key in keyof TValues]: Field<TValues[key]>
    }
    submitting = false
    error: string | undefined = undefined
    readonly handleSubmit: (e: FormEvent) => Promise<void>

    private get fieldValues(): {
        readonly [key in keyof TValues]: TValues[key]
        } {
        const vals = {} as {
            [key in keyof TValues]: TValues[key]
        }

        for (const key in this.fields) {
            vals[key] = this.fields[key].value
        }
        return vals
    }
}

class Field<T> {
    constructor(
        public value: T,
        private readonly validator: undefined | ((val: T) => string | undefined)
    ) {
        makeAutoObservable(this)
    }

    readonly set = (val: T): void => {
        this.value = val
        this.validationActive = false
    }
    get rawError(): string | undefined {
        return this.validator?.(this.value)
    }
    get error(): string | undefined {
        if (this.validationActive) {
            return this.rawError
        }
    }
    private validationActive = false
    readonly activateValidation = (): void => {
        this.validationActive = true
    }
    readonly clearValidation = (): void => {
        this.validationActive = false
    }
}

type RequestObservable<T> = {
    state: RequestState<T>
    load: () => void
    dispose: () => void
}

export type RequestState<T> =
    | { readonly kind: 'idle', readonly result: undefined }
    | { readonly kind: 'loading', readonly result: undefined }
    | { readonly kind: 'result', readonly result: T }
    | { readonly kind: 'error', readonly result: undefined, readonly error: unknown }

export function request<T>(fn: () => Promise<T>, { lazy }: { lazy?: boolean } = {}): RequestObservable<T> {
    let latestRequestId: string | undefined
    async function load() {
        const thisRequestId = latestRequestId = String(Math.random())

        res.state = { kind: 'loading', result: undefined }

        try {
            const result = await fn()

            if (thisRequestId === latestRequestId) {
                res.state = { kind: 'result', result }
            }
        } catch (error: unknown) {
            if (thisRequestId === latestRequestId) {
                res.state = { kind: 'error', error, result: undefined }
                console.error(error)
            }
        }

        return res.state
    }

    let autorunDisposer: IReactionDisposer | undefined
    const res: RequestObservable<T> = observable({
        state: { kind: 'idle', result: undefined },
        load: (
            lazy
                ? () => {
                    if (autorunDisposer == null) {
                        autorunDisposer = autorun(load)
                    } else {
                        return load()
                    }
                }
                : load
        ),
        dispose: () => {
            autorunDisposer?.()
        }
    })

    if (!lazy) {
        autorunDisposer = autorun(load)
    }

    return res
}

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

export function useObservableState<T extends Record<string, unknown>>(init: () => T, deps?: unknown[]): T {
    const [obs, setObs] = useState(() => observable(init()))

    useEffect(() => {
        setObs(init())
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, deps)

    return obs
}
