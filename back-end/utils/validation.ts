
export function getEmailValidationError(val: string) {
    if (val.length === 0) {
        return 'Please enter your email'
    }
    if (!val.includes('@')) {
        return 'Please enter a valid email address'
    }
}

export function getPasswordValidationError(val: string) {
    if (val.length === 0) {
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