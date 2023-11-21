import { Maybe } from "../types/misc"

export function getEmailValidationError(val: Maybe<string>) {
    if (val == null || val.length === 0) {
        return 'Please enter your email'
    }
    if (!val.includes('@')) {
        return 'Please enter a valid email address'
    }
}

export function getPasswordValidationError(val: Maybe<string>) {
    if (val == null || val.length === 0) {
        return 'Please enter a password'
    }
    if (val.length < 8) {
        return 'Password must be at least eight characters'
    }
    if (!val.match(/[a-zA-Z]/)) {
        return 'Password must contain an alphabetic character'
    }
    if (!val.match(/[0-9]/)) {
        return 'Password must contain a numeric character'
    }
}

const UUID_REGEX = /^[a-z0-9]{8}-[a-z0-9]{4}-[a-z0-9]{4}-[a-z0-9]{4}-[a-z0-9]{12}$/
export function getUuidValidationError(val: Maybe<string>) {
    if (val == null || val.length === 0) {
        return 'Please enter a value'
    }

    if (!UUID_REGEX.test(val)) {
        return 'Invalid format'
    }
}
