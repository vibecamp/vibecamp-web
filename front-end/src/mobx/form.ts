import { action, makeAutoObservable, reaction } from 'mobx'
import { CommonFieldProps } from '../components/core/_common'
import { IDisposer } from 'mobx-utils'
import { objectValues } from '../../../back-end/utils/misc'
import { setter } from './misc'

export type FormOptions<T extends Record<string, unknown>> = {
    initialValues: T,
    validators: FormValidators<T>,
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

    readonly dispose = () => {
        for (const field of objectValues(this.fields)) {
            field.dispose()
        }
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
        return objectValues(this.fields).every(field => field.isValid)
    }

    readonly clear = action(() => {
        for (const key in this.fields) {
            this.fields[key].value = this.opts.initialValues[key]
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

        this.validationActiveReaction = reaction(
            () => this.value,
            () => this.validationActive = false
        )
    }

    private validationActiveReaction: IDisposer

    readonly dispose = () => {
        this.validationActiveReaction()
    }

    get error(): string | undefined {
        return this.validator?.(this.value)
    }
    get isValid() {
        return this.error == null
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
        onChange: setter(field, 'value'),
        error: field.displayError,
        onBlur: field.activateValidation
    }
}