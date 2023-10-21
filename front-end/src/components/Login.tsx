import React from 'react'
import { observer } from 'mobx-react-lite'
import Spacer from './core/Spacer'
import Input from './core/Input'
import Button from './core/Button'
import Store from '../Store'
import { DEFAULT_FORM_ERROR, useObservableState, useRequest } from '../mobx-utils'
import { getEmailValidationError, getPasswordValidationError } from '../../../back-end/common/validation'
import Stripes from './core/Stripes'
import { vibefetch } from '../vibefetch'

export default observer(() => {
    const state = useObservableState({
        mode: 'login' as 'login' | 'signup',
        emailAddress: '',
        password: '',
        validatingEmailAddress: false,
        validatingPassword: false
    })

    const emailAddressError = getEmailValidationError(state.emailAddress)
    const passwordError = getPasswordValidationError(state.password)

    const loginOrSignup = useRequest(async () => {
        state.validatingEmailAddress = true
        state.validatingPassword = true

        if (emailAddressError || passwordError) {
            return
        }

        const { jwt } = await vibefetch(Store.jwt, `/${state.mode}`, 'post', {
            email_address: state.emailAddress,
            password: state.password
        })

        if (jwt == null) {
            throw Error()
        }

        Store.jwt = jwt

        state.emailAddress = ''
        state.password = ''
    }, { lazy: true })

    return (
        <form className='login' onSubmit={loginOrSignup.load}>
            <Stripes position='top-left' />

            <img src="vibecamp.png" className='logo' />

            <Spacer size={24} />

            <Input
                label='Email address'
                type='email'
                disabled={loginOrSignup.state.kind === 'loading'}
                value={state.emailAddress}
                onChange={val => { state.emailAddress = val; state.validatingEmailAddress = false }}
                error={state.validatingEmailAddress ? emailAddressError : undefined}
                onBlur={() => state.validatingEmailAddress = true}
            />

            <Spacer size={16} />

            <Input
                label='Password'
                type='password'
                disabled={loginOrSignup.state.kind === 'loading'}
                value={state.password}
                onChange={val => { state.password = val; state.validatingPassword = false }}
                error={state.validatingPassword ? passwordError : undefined}
                onBlur={() => state.validatingPassword = true}
            />

            {loginOrSignup.state.kind === 'error' &&
                <>
                    <Spacer size={8} />

                    <div style={{ color: 'red' }}>
                        {DEFAULT_FORM_ERROR}
                    </div>
                </>}

            <Spacer size={24} />


            <Button isSubmit isPrimary isLoading={loginOrSignup.state.kind === 'loading'}>
                {state.mode === 'login'
                    ? 'Log in'
                    : 'Sign up'}
            </Button>

            <Spacer size={8} />

            <Button isDisabled={loginOrSignup.state.kind === 'error'} onClick={() => state.mode = (state.mode === 'login' ? 'signup' : 'login')}>
                {state.mode === 'login'
                    ? 'Create an account'
                    : 'I already have an account'}
            </Button>
        </form>
    )
})