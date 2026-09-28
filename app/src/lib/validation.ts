import { t } from '@/copy/t'

type Maybe<T> = T | null | undefined

export function getEmailValidationError(val: Maybe<string>) {
    if (val == null || val.length === 0) {
        return t('validation.emailRequired')
    }
    if (!val.includes('@')) {
        return t('validation.emailInvalid')
    }
}

export function getPasswordValidationError(val: Maybe<string>) {
    if (val == null || val.length === 0) {
        return t('validation.passwordRequired')
    }
    if (val.length < 8) {
        return t('validation.passwordTooShort')
    }
    if (!val.match(/[a-zA-Z]/)) {
        return t('validation.passwordNeedsLetter')
    }
    if (!val.match(/[0-9]/)) {
        return t('validation.passwordNeedsNumber')
    }
}
