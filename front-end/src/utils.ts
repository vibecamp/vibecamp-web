import dayjs, { Dayjs } from 'dayjs'

import { TABLE_ROWS } from '../../back-end/types/db-types'
import { objectEntries, objectFromEntries } from '../../back-end/utils/misc'
import { setter } from './mobx/misc'

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

export function jsonParse(json: string): unknown | undefined {
    try {
        return JSON.parse(json)
    } catch {
        return undefined
    }
}

export const preventingDefault = <F extends () => unknown>(fn: F) => (event: { preventDefault: () => void }) => {
    event.preventDefault()
    return fn()
}

export const DEFAULT_FORM_ERROR = 'Something went wrong, please try again'

export function doNothing() {
}

export function validate<
    TObj extends object
>(
    obj: TObj,
    validators: Partial<{[K in keyof TObj]: (val: TObj[K]) => string | undefined}>
): ErrorsFor<TObj> {
    return objectFromEntries(
        objectEntries(validators)
            .map(([key, validator]) => [key, validator!(obj[key as unknown as keyof TObj])] as const)
    )
}

export type ErrorsFor<TObj extends object> = Partial<{[K in keyof TObj]: string | undefined}>

export function someValue<TObj extends object>(obj: TObj, cb: (value: TObj[keyof TObj]) => boolean): boolean {
    for (const key in obj) {
        if (cb(obj[key])) {
            return true
        }
    }
    return false
}

export function fieldProps<TObj extends object, TField extends keyof TObj>(obj: TObj, field: TField, errors?: ErrorsFor<TObj>, showingErrors?: boolean): {
    value: TObj[TField],
    onChange: (val: TObj[TField]) => void,
    error: false | undefined | string
} {
    return {
        value: obj[field],
        onChange: setter(obj, field),
        error: showingErrors && errors?.[field]
    }
}

export const festivalsHappeningAt = (date: Dayjs) =>
    TABLE_ROWS.festival
        .filter(e =>
            date.isAfter(dayjs.utc(e.start_date)) &&
            date.isBefore(dayjs.utc(e.end_date)))