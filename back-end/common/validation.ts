
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
    if (val.length < 6) {
        return 'Password must be at least six characters'
    }
}