import { action, makeAutoObservable } from 'mobx'
import { CommonFieldProps } from '../components/core/_common'

export type FormOptions<T extends Record<string, unknown>> = {
    initialValues: T,
    validators: Partial<{ [key in keyof T]: (val: T[key]) => string | undefined }>,
}

export type FormValidators<T extends Record<string, unknown>> = Partial<{ [key in keyof T]: (val: T[key]) => string | undefined }>

export class Form<TValues extends Record<string, unknown>> {
    constructor(
        private readonly opts: FormOptions<TValues>
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

        makeAutoObservable(this)
    }

    fields: {
        readonly [key in keyof TValues]: Field<TValues[key]>
    }

    get fieldValues(): {
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

    get isValid(): boolean {
        for (const field in this.fields) {
            if (this.fields[field].error) {
                return false
            }
        }

        return true
    }

    readonly clear = action(() => {
        for (const key in this.fields) {
            this.fields[key].set(this.opts.initialValues[key])
        }
    })

    readonly activateAllValidation = action(() => {
        for (const key in this.fields) {
            this.fields[key].activateValidation()
        }
    })
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
    get error(): string | undefined {
        return this.validator?.(this.value)
    }
    get displayError(): string | undefined {
        if (this.validationActive) {
            return this.error
        }
    }

    private validationActive = false
    
    readonly activateValidation = (): void => {
        this.validationActive = true
    }
}

export function fieldToProps<T>(field: Field<T>): Pick<CommonFieldProps<T>, 'value' | 'onChange' | 'error' | 'onBlur'> {
    return {
        value: field.value,
        onChange: field.set,
        error: field.displayError,
        onBlur: field.activateValidation
    }
}