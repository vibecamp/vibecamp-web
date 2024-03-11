import React from 'react'

import { getEmailValidationError, getPasswordValidationError } from '../../../back-end/utils/validation'
import { useObservableClass } from '../mobx/hooks'
import { observer, setter } from '../mobx/misc'
import { request } from '../mobx/request'
import Store from '../stores/Store'
import { DEFAULT_FORM_ERROR, doNothing, preventingDefault } from '../utils'
import { vibefetch } from '../vibefetch'
import Button from './core/Button'
import Col from './core/Col'
import Input from './core/Input'
import LoadingDots from './core/LoadingDots'
import Modal from './core/Modal'
import Spacer from './core/Spacer'

export default observer(() => {
    const loading = Store.accountInfo.state.kind === 'loading'
    const loadingOrError = loading || Store.accountInfo.state.kind === 'error'

    const emailAddressForm = useObservableClass(class {
        emailAddress: string | null = null

        get emailAddressError() {
            return getEmailValidationError(this.emailAddress)
        }

        readonly beginChangingEmail = () => {
            this.emailAddress = Store.accountInfo.state.result?.email_address ?? null
        }
        readonly stopChangingEmail = () => {
            this.emailAddress = null
        }

        readonly updateEmail = request(async () => {
            if (this.emailAddressError) {
                return { fieldError: true }
            }

            const { status } = await vibefetch(Store.jwt, '/account/update-email', 'put', {
                email_address: this.emailAddress!
            })

            if (status !== 200) {
                return { submissionError: DEFAULT_FORM_ERROR }
            }

            await Store.accountInfo.load()
            this.stopChangingEmail()
        }, { lazy: true })
    })

    const passwordForm = useObservableClass(class {
        password: string | null = null
        passwordConfirmation: string | null = null

        get passwordError() {
            return getPasswordValidationError(this.password)
        }
        get passwordConfirmationError() {
            if (this.password !== this.passwordConfirmation) {
                return 'Passwords don\'t match'
            }
        }

        readonly beginChangingPassword = () => {
            this.password = ''
            this.passwordConfirmation = ''
        }
        readonly stopChangingPassword = () => {
            this.password = null
            this.passwordConfirmation = null
        }

        readonly updatePassword = request(async () => {
            if (this.passwordError || this.passwordConfirmationError) {
                return { fieldError: true }
            }

            const { status } = await vibefetch(Store.jwt, '/account/update-password', 'put', {
                password: this.password!
            })

            if (status !== 200) {
                return { submissionError: DEFAULT_FORM_ERROR }
            }

            await Store.accountInfo.load()
            this.stopChangingPassword()
        }, { lazy: true })
    })

    return (
        <Col padding={20} pageLevel justify={loadingOrError ? 'center' : undefined} align={loadingOrError ? 'center' : undefined}>
            {Store.accountInfo.state.kind === 'result' &&
                <h1 style={{ fontSize: 24, alignSelf: 'flex-start' }}>
                    My account
                </h1>}

            <Spacer size={loadingOrError ? 300 : 24} />

            {loading
                ? <LoadingDots size={100} color='var(--color-accent-1)' />
                : Store.accountInfo.state.kind === 'error' || Store.accountInfo.state.result == null
                    ? 'Failed to load'
                    : Store.accountInfo.state.kind === 'result'
                        ? <>
                            <Input
                                label='Email address'
                                value={Store.accountInfo.state.result?.email_address}
                                onChange={doNothing}
                                disabled
                            />

                            <Spacer size={8} />

                            <Button onClick={emailAddressForm.beginChangingEmail}>
                                Change email
                            </Button>

                            <Spacer size={24} />

                            <Input
                                label='Password'
                                value='········'
                                onChange={doNothing}
                                disabled
                            />

                            <Spacer size={8} />

                            <Button onClick={passwordForm.beginChangingPassword}>
                                Change password
                            </Button>

                            <Spacer size={32} />

                            <Button isDanger isPrimary onClick={Store.logOut}>
                                Log out
                            </Button>
                        </>
                        : null}

            <Modal isOpen={emailAddressForm.emailAddress != null} onClose={emailAddressForm.stopChangingEmail} side='right'>
                {() =>
                    <form onSubmit={preventingDefault(emailAddressForm.updateEmail.load)} noValidate>
                        <Col padding={20} pageLevel>
                            <Input
                                label='New email address'
                                value={emailAddressForm.emailAddress ?? ''}
                                onChange={setter(emailAddressForm, 'emailAddress')}
                                error={emailAddressForm.updateEmail.state.result?.fieldError ? emailAddressForm.emailAddressError : undefined}
                            />

                            <Spacer size={24} />

                            <Button isSubmit isPrimary isLoading={emailAddressForm.updateEmail.state.kind === 'loading'} disabled={emailAddressForm.emailAddress === Store.accountInfo.state.result?.email_address}>
                            Submit
                            </Button>
                        </Col>
                    </form>}
            </Modal>

            <Modal isOpen={passwordForm.password != null} onClose={passwordForm.stopChangingPassword} side='right'>
                {() =>
                    <form onSubmit={preventingDefault(passwordForm.updatePassword.load)} noValidate>
                        <Col padding={20} pageLevel>
                            <Input
                                label='New password'
                                type='password'
                                value={passwordForm.password ?? ''}
                                onChange={setter(passwordForm, 'password')}
                                error={passwordForm.updatePassword.state.result?.fieldError ? passwordForm.passwordError : undefined}
                            />

                            <Spacer size={16} />

                            <Input
                                label='Confirm password'
                                type='password'
                                value={passwordForm.passwordConfirmation ?? ''}
                                onChange={setter(passwordForm, 'passwordConfirmation')}
                                error={passwordForm.updatePassword.state.result?.fieldError ? passwordForm.passwordConfirmationError : undefined}
                            />

                            <Spacer size={24} />

                            <Button isSubmit isPrimary isLoading={passwordForm.updatePassword.state.kind === 'loading'}>
                            Submit
                            </Button>
                        </Col>
                    </form>}
            </Modal>
        </Col>
    )
})
