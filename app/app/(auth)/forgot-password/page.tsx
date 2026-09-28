'use client'

import { useState } from 'react'
import AuthForm from '@/components/auth/AuthForm'
import ButtonLink from '@/components/core/ButtonLink'
import Input from '@/components/core/Input'
import { t } from '@/copy/t'
import useForm, { fieldToProps } from '@/hooks/useForm'
import { vibefetch } from '@/lib/fetch'
import { LOGIN_PATH } from '@/lib/routes'
import { DEFAULT_FORM_ERROR } from '@/lib/ui'
import { getEmailValidationError } from '@/lib/validation'

export default function ForgotPasswordPage() {
    const [emailSent, setEmailSent] = useState(false)

    const form = useForm({
        initial: {
            emailAddress: '',
        },
        validators: {
            emailAddress: getEmailValidationError,
        },
        submit: async ({ emailAddress }) => {
            const { status } = await vibefetch(null, '/account/send-password-reset-email', 'post', {
                email_address: emailAddress,
            })

            if (status !== 200) {
                return DEFAULT_FORM_ERROR
            }

            setEmailSent(true)
        },
    })

    return (
        <AuthForm
            onSubmit={form.handleSubmit}
            submitting={form.submitting}
            submitDisabled={emailSent}
            submitLabel={t('passwordReset.requestSubmit')}
            error={form.wholeFormError}
            notice={emailSent ? t('passwordReset.emailSent') : undefined}
            links={<ButtonLink href={LOGIN_PATH}>{t('passwordReset.backToLogin')}</ButtonLink>}
        >
            <Input
                label={t('common.emailAddressLabel')}
                type='email'
                autoComplete='email'
                disabled={form.submitting}
                {...fieldToProps(form.fields.emailAddress)}
            />
        </AuthForm>
    )
}
