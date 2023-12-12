import { makeAutoObservable, reaction } from 'mobx'
import { CommonFieldProps } from '../components/core/_common'
import { IDisposer } from 'mobx-utils'
import { objectEntries, objectFromEntries, objectValues } from '../../../back-end/utils/misc'
import { setter } from './misc'
import { RequestObservable, RequestState, request } from './request'
import { DEFAULT_FORM_ERROR } from '../utils'

export type FormOptions<TValues extends Record<string, unknown>, TSubmitterName extends string> = {
    initialValues: TValues,
    validators: FormValidators<TValues>,
    submitters?: Record<TSubmitterName, (values: TValues) => Promise<void> | void>
}

export type FormValidators<T extends Record<string, unknown>> = Partial<{ [key in keyof T]: (val: T[key]) => string | undefined }>

export type Form<TValues extends Record<string, unknown>, TSubmitterName extends string = never> = ReturnType<typeof form<TValues, TSubmitterName>>
export const form = <TValues extends Record<string, unknown>, TSubmitterName extends string = never>({ initialValues, validators, submitters }: FormOptions<TValues, TSubmitterName>) => {

    const submitterRequests: Record<TSubmitterName, RequestObservable<void>> = (
        submitters == null
            ? {} as Record<TSubmitterName, RequestObservable<void>>
            : objectFromEntries(
                objectEntries(submitters).map(([ name, submitFn ]) => [
                    name,
                    request(async () => {
                        form.activateAllValidation()

                        if (!form.isValid) {
                            throw DEFAULT_FORM_ERROR
                        }

                        await submitFn(form.fieldValues)
                    }, { lazy: true })
                ])
            )
    )

    const form = makeAutoObservable({
        fields: objectFromEntries(objectEntries(initialValues).map(([name, value]) => [
            name,
            field({ value, validator: validators[name] })
        ])) as { [key in keyof TValues]: Field<TValues[key]> },

        get fieldValues(): TValues {
            return objectFromEntries(objectEntries(this.fields).map(([name, field]) => [name, field.value])) as TValues
        },
        get isValid(): boolean {
            return objectValues(this.fields).every(field => field.isValid)
        },
        get submissionState(): Record<TSubmitterName, RequestState<void>> {
            return objectFromEntries(objectEntries(submitterRequests).map(([name, request]) => [name, request.state]))
        },

        dispose: () => {
            for (const field of objectValues(form.fields)) {
                field.dispose()
            }
            for (const request of objectValues(submitterRequests)) {
                request.dispose()
            }
        },
        clear: () => {
            for (const key in form.fields) {
                form.fields[key].value = initialValues[key]
            }
        },
        activateAllValidation: () => {
            for (const key in form.fields) {
                form.fields[key].activateValidation()
            }
        },
        submitters: objectFromEntries(objectEntries(submitterRequests).map(([name, request]) => [name, request.load]))
    })

    return form
}

export type Field<T> = ReturnType<typeof field<T>>
const field = <T>({ value, validator }: { value: T, validator: undefined | ((val: T) => string | undefined) }) => {
    const field = makeAutoObservable({
        value,
        validationActive: false,
        dispose: null as unknown as IDisposer, // initialized later

        get error(): string | undefined {
            return validator?.(this.value)
        },
        get isValid() {
            return this.error == null
        },
        get displayError(): string | undefined {
            if (this.validationActive) {
                return this.error
            }
        },

        activateValidation: (): void => {
            field.validationActive = true
        }
    })

    field.dispose = reaction(
        () => field.value,
        () => field.validationActive = false
    )

    return field
}

export function fieldToProps<T>(field: Field<T>): Pick<CommonFieldProps<T>, 'value' | 'onChange' | 'error' | 'onBlur'> {
    return {
        value: field.value,
        onChange: setter(field, 'value'),
        error: field.displayError,
        onBlur: field.activateValidation
    }
}
