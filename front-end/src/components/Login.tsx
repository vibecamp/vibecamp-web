import React from 'react'
import { observer } from 'mobx-react-lite'
import Spacer from './core/Spacer'
import Input from './core/Input'
import Button from './core/Button'
import Store from '../Store'
import { getEmailValidationError, getPasswordValidationError } from '../../../back-end/common/validation'
import Stripes from './core/Stripes'
import { vibefetch } from '../vibefetch'
import { DEFAULT_FORM_ERROR, preventingDefault } from '../utils'
import { useObservableState, useRequest, useStable } from '../mobx/hooks'
import { Form, fieldToProps } from '../mobx/form'
import Col from './core/Col'

export default observer(() => {
    const state = useObservableState({
        mode: 'login' as 'login' | 'signup'
    })

    const loginForm = useStable(() => new Form({
        initialValues: {
            emailAddress: '',
            password: '',
        },
        validators: {
            emailAddress: getEmailValidationError,
            password: getPasswordValidationError
        }
    }))

    const loginOrSignup = useRequest(async () => {
        loginForm.activateAllValidation()

        if (!loginForm.isValid) {
            return
        }

        const { jwt } = await vibefetch(null, `/${state.mode}`, 'post', {
            email_address: loginForm.fields.emailAddress.value,
            password: loginForm.fields.password.value
        })

        if (jwt == null) {
            throw Error()
        }

        Store.jwt = jwt

        loginForm.clear()
    }, { lazy: true })

    return (
        <form className='login' onSubmit={preventingDefault(loginOrSignup.load)}>
            <Col padding={20}>
                <Stripes position='top-left' />

                <img src="vibecamp.png" className='logo' />

                <Spacer size={24} />

                <Input
                    label='Email address'
                    type='email'
                    disabled={loginOrSignup.state.kind === 'loading'}
                    {...fieldToProps(loginForm.fields.emailAddress)}
                />

                <Spacer size={16} />

                <Input
                    label='Password'
                    type='password'
                    disabled={loginOrSignup.state.kind === 'loading'}
                    {...fieldToProps(loginForm.fields.password)}
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

                <Button disabled={loginOrSignup.state.kind === 'error'} onClick={() => state.mode = (state.mode === 'login' ? 'signup' : 'login')}>
                    {state.mode === 'login'
                        ? 'Create an account'
                        : 'I already have an account'}
                </Button>
            </Col>
        </form>
    )
})