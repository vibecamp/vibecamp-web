'use client'

import AuthForm from '@/components/auth/AuthForm'
import ButtonLink from '@/components/core/ButtonLink'
import Input from '@/components/core/Input'
import { t } from '@/copy/t'
import useForm, { fieldToProps } from '@/hooks/useForm'
import useRedirectWhenSignedIn from '@/hooks/useRedirectWhenSignedIn'
import { useStore } from '@/hooks/useStore'
import { vibefetch } from '@/lib/fetch'
import { FORGOT_PASSWORD_PATH, LOGIN_PATH, withNext } from '@/lib/routes'
import { DEFAULT_FORM_ERROR } from '@/lib/ui'
import { getEmailValidationError, getPasswordValidationError } from '@/lib/validation'

export default function SignupPage() {
    const store = useStore()
    const next = useRedirectWhenSignedIn()

    const form = useForm({
        initial: {
            emailAddress: '',
            password: '',
            passwordConfirmation: '',
        },
        validators: {
            emailAddress: getEmailValidationError,
            password: getPasswordValidationError,
            passwordConfirmation: (passwordConfirmation, { password }) => {
                if (password !== passwordConfirmation) {
                    return t('validation.passwordsDontMatch')
                }
            },
        },
        submit: async ({ emailAddress, password }, reset) => {
            const { body } = await vibefetch(null, '/signup', 'post', {
                email_address: emailAddress,
                password,
            })

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
            submitLabel={t('signup.submit')}
            error={form.wholeFormError}
            links={
                <>
                    <ButtonLink href={withNext(LOGIN_PATH, next)}>
                        {t('signup.alreadyHaveAccount')}
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
                label={t('common.newPasswordLabel')}
                type='password'
                autoComplete='new-password'
                disabled={form.submitting}
                {...fieldToProps(form.fields.password)}
            />

            <Input
                label={t('common.confirmPasswordLabel')}
                type='password'
                autoComplete='new-password'
                disabled={form.submitting}
                {...fieldToProps(form.fields.passwordConfirmation)}
            />
        </AuthForm>
    )
}
