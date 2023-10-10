import React from 'react'
import { observer } from 'mobx-react-lite'
import Spacer from './core/Spacer'
import Input from './core/Input'
import Button from './core/Button'
import Store from '../Store'
import { DEFAULT_FORM_ERROR, form, useObservableState } from '../mobx-utils'
import { login, signup } from '../api/auth'
import { getEmailValidationError, getPasswordValidationError } from '../../../back-end/common/validation'

export default observer(() => {
    const state = useObservableState(() => ({
        mode: 'login' as 'login' | 'signup',
        loginForm: form({
            initialValues: {
                email_address: '',
                password: ''
            },
            validators: {
                email_address: getEmailValidationError,
                password: getPasswordValidationError
            },
            submit: async ({ email_address, password }) => {
                const requestFn = state.mode === 'login' ? login : signup
                const { status, jwt } = await requestFn({ email_address, password})

                if (jwt == null) {
                    switch (status) {
                    case 401: return 'Invalid credentials'
                    default: return DEFAULT_FORM_ERROR
                    }
                } else {
                    Store.jwt = jwt
    
                    state.loginForm.fields.email_address.set('')
                    state.loginForm.fields.password.set('')
                }
            }
        })
    }))

    return (
        <form className='login' onSubmit={state.loginForm.handleSubmit}>
            <div className='stripes'>
                <div></div>
                <div></div>
                <div></div>
            </div>

            <img src="vibecamp.png" className='logo' />

            <Spacer size={24} />

            <Input
                label='Email address'
                type='email'
                disabled={state.loginForm.submitting}
                value={state.loginForm.fields.email_address.value}
                onChange={state.loginForm.fields.email_address.set}
                error={state.loginForm.fields.email_address.error}
                onBlur={state.loginForm.fields.email_address.activateValidation}
            />

            <Spacer size={16} />

            <Input
                label='Password'
                type='password'
                disabled={state.loginForm.submitting}
                value={state.loginForm.fields.password.value}
                onChange={state.loginForm.fields.password.set}
                error={state.loginForm.fields.password.error}
                onBlur={state.loginForm.fields.password.activateValidation}
            />

            {state.loginForm.error &&
                <>
                    <Spacer size={8} />
                
                    <div style={{ color: 'red' }}>
                        {state.loginForm.error}
                    </div>
                </>}
                
            <Spacer size={24} />


            <Button isSubmit isPrimary isLoading={state.loginForm.submitting}>
                {state.mode === 'login' 
                    ? 'Log in'
                    : 'Sign up'}
            </Button>

            <Spacer size={8} />

            <Button isDisabled={state.loginForm.submitting} onClick={() => state.mode = (state.mode === 'login' ? 'signup' : 'login')}>
                {state.mode === 'login'
                    ? 'Create an account'
                    : 'I already have an account'}
            </Button>

            {/* <a className='loginWithTwitter' href='/home/announcements'>
                <img src="twitter.png" width={20} height={20} />
                <Spacer size={16} />
                Log in with Twitter
            </a> */}
        </form>
    )
})