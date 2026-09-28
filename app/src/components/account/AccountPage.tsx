'use client'

import { useState } from 'react'
import { t } from '@/copy/t'
import useForm, { fieldToProps } from '@/hooks/useForm'
import { useStore } from '@/hooks/useStore'
import { vibefetch } from '@/lib/fetch'
import { DEFAULT_FORM_ERROR } from '@/lib/ui'
import { getEmailValidationError, getPasswordValidationError } from '@/lib/validation'
import Button from '../core/Button'
import Icon from '../core/Icon'
import Input from '../core/Input'
import Modal from '../core/Modal'
import PageLoading from '../PageLoading'
import UpdateMyInfo from './UpdateMyInfo'

type Editing = 'none' | 'email' | 'password'

export default function AccountPage() {
    const store = useStore()
    const { kind, result: accountInfo } = store.accountInfo.state
    const [editing, setEditing] = useState<Editing>('none')
    const stopEditing = () => setEditing('none')

    if (kind === 'loading') return <PageLoading />
    if (kind === 'error' || accountInfo == null) return <PageLoading error />

    return (
        <div className='page narrow'>
            <section className='account-section'>
                <h2>{t('account.updateMyInfo')}</h2>
                <UpdateMyInfo />
            </section>

            <section className='account-section'>
                <h2>{t('nav.account')}</h2>
                <div className='credential-row'>
                    <div className='credential-text'>
                        <span className='label'>{t('common.emailAddressLabel')}</span>
                        <span className='value'>{accountInfo.email_address}</span>
                    </div>
                    <Button onClick={() => setEditing('email')} isCompact>
                        {t('account.changeEmail')}
                    </Button>
                </div>
                <div className='credential-row'>
                    <div className='credential-text'>
                        <span className='label'>{t('common.passwordLabel')}</span>
                        <span className='value'>{t('account.passwordMask')}</span>
                    </div>
                    <Button onClick={() => setEditing('password')} isCompact>
                        {t('account.changePassword')}
                    </Button>
                </div>
            </section>

            <Button isDanger onClick={store.logOut}>
                <Icon name='logout' />
                {t('account.logOut')}
            </Button>

            <Modal
                isOpen={editing === 'email'}
                onClose={stopEditing}
                title={t('account.changeEmail')}
            >
                {() => <EmailAddressEditor stopEditing={stopEditing} />}
            </Modal>

            <Modal
                isOpen={editing === 'password'}
                onClose={stopEditing}
                title={t('account.changePassword')}
            >
                {() => <PasswordEditor stopEditing={stopEditing} />}
            </Modal>
        </div>
    )
}

function EmailAddressEditor({ stopEditing }: { stopEditing: () => void }) {
    const store = useStore()
    const currentEmail = store.accountInfo.state.result?.email_address

    const form = useForm({
        initial: {
            emailAddress: currentEmail ?? '',
        },
        validators: {
            emailAddress: getEmailValidationError,
        },
        submit: async ({ emailAddress }) => {
            const { status } = await vibefetch(store.jwt, '/account/update-email', 'put', {
                email_address: emailAddress,
            })

            if (status !== 200) {
                return DEFAULT_FORM_ERROR
            }

            await store.accountInfo.load()
            stopEditing()
        },
    })

    return (
        <form onSubmit={form.handleSubmit} noValidate className='stack'>
            <Input
                label={t('account.newEmailAddressLabel')}
                type='email'
                autoComplete='email'
                {...fieldToProps(form.fields.emailAddress)}
            />

            <Button
                isSubmit
                isPrimary
                isLoading={form.submitting}
                disabled={form.fields.emailAddress.value === currentEmail}
            >
                {t('common.submit')}
            </Button>
        </form>
    )
}

function PasswordEditor({ stopEditing }: { stopEditing: () => void }) {
    const store = useStore()

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
        submit: async ({ password }) => {
            const { status } = await vibefetch(store.jwt, '/account/update-password', 'put', {
                password,
            })

            if (status !== 200) {
                return DEFAULT_FORM_ERROR
            }

            await store.accountInfo.load()
            stopEditing()
        },
    })

    return (
        <form onSubmit={form.handleSubmit} noValidate className='stack'>
            <Input
                label={t('common.newPasswordLabel')}
                type='password'
                autoComplete='new-password'
                {...fieldToProps(form.fields.password)}
            />

            <Input
                label={t('common.confirmPasswordLabel')}
                type='password'
                autoComplete='new-password'
                {...fieldToProps(form.fields.passwordConfirmation)}
            />

            <Button isSubmit isPrimary isLoading={form.submitting}>
                {t('common.submit')}
            </Button>
        </form>
    )
}
