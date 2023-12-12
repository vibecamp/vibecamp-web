import React from 'react'
import { observer } from 'mobx-react-lite'
import Spacer from './core/Spacer'
import Input from './core/Input'
import Button from './core/Button'
import Store from '../Store'
import { getEmailValidationError, getPasswordValidationError } from '../../../back-end/utils/validation'
import Stripes from './core/Stripes'
import { vibefetch } from '../vibefetch'
import { DEFAULT_FORM_ERROR, preventingDefault } from '../utils'
import { useObservableClass } from '../mobx/hooks'
import Col from './core/Col'
import ErrorMessage from './core/ErrorMessage'
import { request } from '../mobx/request'
import { setter } from '../mobx/misc'

export default observer(() => {
    const state = useObservableClass(class {
        mode: 'login' | 'signup' = 'login'

        emailAddress = ''
        password = ''
        passwordConfirmation = ''

        get emailAddressError() {
            return getEmailValidationError(this.emailAddress)
        }

        get passwordError() {
            return getPasswordValidationError(this.password)
        }

        get passwordConfirmationError() {
            if (this.mode === 'signup' && this.password !== this.passwordConfirmation) {
                return 'Passwords don\'t match'
            }
        }

        readonly toggleState = () => {
            this.mode = (this.mode === 'login' ? 'signup' : 'login')
        }

        readonly loginOrSignup = request(async () => {
            const validationError = (
                this.emailAddressError ||
                this.passwordError ||
                this.passwordConfirmationError
            )

            if (validationError) {
                return { fieldError: true }
            }

            const { body, status } = await vibefetch(null, `/${state.mode}`, 'post', {
                email_address: this.emailAddress,
                password: this.password
            })
            const { jwt } = body ?? {}

            if (state.mode === 'login' && status === 401) {
                return { submissionError: 'Incorrect email or password' }
            }

            if (jwt == null) {
                return { submissionError: DEFAULT_FORM_ERROR }
            }

            Store.jwt = jwt
            this.emailAddress = this.password = this.passwordConfirmation = ''
        }, { lazy: true })
    })

    const submissionState = state.loginOrSignup.state
    const loading = submissionState.kind === 'loading'
    const submissionError = (
        submissionState.kind === 'error'
            ? DEFAULT_FORM_ERROR
            : submissionState.result?.submissionError
    )

    console.log({ ...submissionState })

    return (
        <form className='login' onSubmit={preventingDefault(state.loginOrSignup.load)} noValidate>
            <Col padding={20}>
                <Stripes position='top-left' />

                <img src="vibecamp.png" className='logo' alt='Vibecamp logo' />

                <Spacer size={24} />

                <Input
                    label='Email address'
                    type='email'
                    disabled={loading}
                    autocomplete={state.mode === 'login' ? 'current-password' : 'new-password'}
                    value={state.emailAddress}
                    onChange={setter(state, 'emailAddress')}
                    error={submissionState.result?.fieldError ? state.emailAddressError : undefined}
                />

                <Spacer size={16} />

                <Input
                    label='Password'
                    type='password'
                    disabled={loading}
                    autocomplete={state.mode === 'login' ? 'current-password' : 'new-password'}
                    value={state.password}
                    onChange={setter(state, 'password')}
                    error={submissionState.result?.fieldError ? state.passwordError : undefined}
                />

                {state.mode === 'signup' &&
                    <>
                        <Spacer size={16} />

                        <Input
                            label='Confirm password'
                            type='password'
                            disabled={loading}
                            value={state.passwordConfirmation}
                            onChange={setter(state, 'passwordConfirmation')}
                            error={submissionState.result?.fieldError ? state.passwordConfirmationError : undefined}
                        />
                    </>}

                <Spacer size={8} />

                <ErrorMessage error={submissionError} />

                <Spacer size={24} />


                <Button isSubmit isPrimary isLoading={loading}>
                    {state.mode === 'login'
                        ? 'Log in'
                        : 'Sign up'}
                </Button>

                <Spacer size={8} />

                <Button onClick={state.toggleState}>
                    {state.mode === 'login'
                        ? 'Create an account'
                        : 'I already have an account'}
                </Button>
            </Col>
        </form>
    )
})