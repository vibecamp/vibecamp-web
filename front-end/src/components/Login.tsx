import React from 'react'
import { observer } from 'mobx-react-lite'
import Spacer from './core/Spacer'
import Input from './core/Input'
import Button from './core/Button'
import { wait } from '../utils'
import Store from '../Store'
import { form } from '../mobx-utils'

const LoginForm = form({
    initialValues: {
        email: '',
        password: ''
    },
    validators: {
        email: val => {
            if (val.length === 0) {
                return 'Please enter your email'
            }
            if (!val.includes('@')) {
                return 'Please enter a valid email address'
            }
        },
        password: val => {
            if (val.length === 0) {
                return 'Please enter a password'
            }
        }
    },
    submit: async ({ email, password }) => {
        await wait(1000)
        Store.jwt = 'foo'

        LoginForm.fields.email.set('')
        LoginForm.fields.password.set('')
    }
})

export default observer(() => {


    return (
        <form className='login' onSubmit={LoginForm.handleSubmit}>
            <div className='stripes'>
                <div></div>
                <div></div>
                <div></div>
            </div>

            <img src="vibecamp.png" className='logo' />

            <Spacer size={24} />

            <Input
                label='Email address'
                value={LoginForm.fields.email.value}
                onChange={LoginForm.fields.email.set}
                error={LoginForm.fields.email.error}
                onBlur={LoginForm.fields.email.activateValidation}
                type='email'
            />

            <Spacer size={16} />

            <Input
                label='Password'
                value={LoginForm.fields.password.value}
                onChange={LoginForm.fields.password.set}
                error={LoginForm.fields.password.error}
                onBlur={LoginForm.fields.password.activateValidation}
                type='password'
            />

            <Spacer size={24} />

            <Button isSubmit isPrimary isLoading={LoginForm.submitting}>
                Log in
            </Button>

            <Spacer size={8} />

            <Button>
                Sign up
            </Button>

            {/* <a className='loginWithTwitter' href='/home/announcements'>
                <img src="twitter.png" width={20} height={20} />
                <Spacer size={16} />
                Log in with Twitter
            </a> */}
        </form>
    )
})