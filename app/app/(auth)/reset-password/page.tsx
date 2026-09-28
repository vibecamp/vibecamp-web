'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import AuthForm from '@/components/auth/AuthForm'
import ButtonLink from '@/components/core/ButtonLink'
import Input from '@/components/core/Input'
import { t } from '@/copy/t'
import useForm, { fieldToProps } from '@/hooks/useForm'
import { useStore } from '@/hooks/useStore'
import { vibefetch } from '@/lib/fetch'
import { DEFAULT_PATH, LOGIN_PATH } from '@/lib/routes'
import { DEFAULT_FORM_ERROR } from '@/lib/ui'
import { getPasswordValidationError } from '@/lib/validation'

export default function ResetPasswordPage() {
    const store = useStore()
    const router = useRouter()
    const secret = useSearchParams().get('secret') ?? ''

    const form = useForm({
        initial: {
            password: '',
            passwordConfirmation: '',
        },
        validators: {
            password: getPasswordValidationError,
            passwordConfirmation: (passwordConfirmation, { password }) => {
                if (password !== passwordConfirmation) {
                    return t('validation.passwordsDontMatch')
                }
            },
        },
        submit: async ({ password }, reset) => {
            const { body } = await vibefetch(null, '/account/reset-password', 'put', {
                password,
                secret,
            })

            const jwt = body?.jwt
            if (jwt == null) {
                return DEFAULT_FORM_ERROR
            }

            store.setJwt(jwt)
            reset()
            router.replace(DEFAULT_PATH)
        },
    })

    return (
        <AuthForm
            onSubmit={form.handleSubmit}
            submitting={form.submitting}
            submitLabel={t('passwordReset.updateSubmit')}
            error={form.wholeFormError}
            links={<ButtonLink href={LOGIN_PATH}>{t('passwordReset.backToLogin')}</ButtonLink>}
        >
            <Input
                label={t('common.newPasswordLabel')}
                type='password'
                autoComplete='new-password'
                disabled={form.submitting}
                {...fieldToProps(form.fields.password)}
            />

            <Input
                label={t('passwordReset.confirmNewPasswordLabel')}
                type='password'
                autoComplete='new-password'
                disabled={form.submitting}
                {...fieldToProps(form.fields.passwordConfirmation)}
            />
        </AuthForm>
    )
}
