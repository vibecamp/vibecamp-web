'use client'

import AuthForm from '@/components/auth/AuthForm'
import ButtonLink from '@/components/core/ButtonLink'
import Input from '@/components/core/Input'
import { t } from '@/copy/t'
import useForm, { fieldToProps } from '@/hooks/useForm'
import useRedirectWhenSignedIn from '@/hooks/useRedirectWhenSignedIn'
import { useStore } from '@/hooks/useStore'
import { vibefetch } from '@/lib/fetch'
import { FORGOT_PASSWORD_PATH, SIGNUP_PATH, withNext } from '@/lib/routes'
import { DEFAULT_FORM_ERROR } from '@/lib/ui'
import { getEmailValidationError, getPasswordValidationError } from '@/lib/validation'

export default function LoginPage() {
    const store = useStore()
    const next = useRedirectWhenSignedIn()

    const form = useForm({
        initial: {
            emailAddress: '',
            password: '',
        },
        validators: {
            emailAddress: getEmailValidationError,
            password: getPasswordValidationError,
        },
        submit: async ({ emailAddress, password }, reset) => {
            const { body, status } = await vibefetch(null, '/login', 'post', {
                email_address: emailAddress,
                password,
            })

            if (status === 401) {
                return t('login.incorrectCredentials')
            }

            const jwt = body?.jwt
            if (jwt == null) {
                return DEFAULT_FORM_ERROR
            }

            store.setJwt(jwt)
            reset()
        },
    })

    return (
        <AuthForm
            onSubmit={form.handleSubmit}
            submitting={form.submitting}
            submitLabel={t('login.submit')}
            error={form.wholeFormError}
            links={
                <>
                    <ButtonLink href={withNext(SIGNUP_PATH, next)}>
                        {t('login.createAccount')}
                    </ButtonLink>

                    <ButtonLink href={FORGOT_PASSWORD_PATH}>{t('login.forgotPassword')}</ButtonLink>
                </>
            }
        >
            <Input
                label={t('common.emailAddressLabel')}
                type='email'
                autoComplete='email'
                disabled={form.submitting}
                {...fieldToProps(form.fields.emailAddress)}
            />

            <Input
                label={t('common.passwordLabel')}
                type='password'
                autoComplete='current-password'
                disabled={form.submitting}
                {...fieldToProps(form.fields.password)}
            />
        </AuthForm>
    )
}
