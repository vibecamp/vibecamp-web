import React from 'react'
import { observer } from 'mobx-react-lite'
import Spacer from './core/Spacer'
import Button from './core/Button'
import Store from '../Store'
import Col from './core/Col'
import Input from './core/Input'
import LoadingDots from './core/LoadingDots'
import { useRequest, useStable } from '../mobx/hooks'
import { Form, fieldToProps } from '../mobx/form'
import { getEmailValidationError, getPasswordValidationError } from '../../../back-end/utils/validation'
import { doNothing, preventingDefault } from '../utils'
import Modal from './core/Modal'
import { vibefetch } from '../vibefetch'
import { action } from 'mobx'

export default observer(() => {
    const loading = Store.accountInfo.state.kind === 'loading'
    const loadingOrError = loading || Store.accountInfo.state.kind === 'error'

    const updatedAccountInfo = useStable(() => new Form({
        initialValues: {
            emailAddress: null as string | null,
            password: null as string | null,
            passwordConfirmation: null as string | null
        },
        validators: {
            emailAddress: getEmailValidationError,
            password: getPasswordValidationError,
            passwordConfirmation: val => {
                if (val !== updatedAccountInfo.fields.password.value) {
                    return 'Passwords don\'t match'
                }
            }
        }
    }))


    const beginChangingEmail = useStable(() => () => {
        updatedAccountInfo.fields.emailAddress.value = Store.accountInfo.state.result?.email_address ?? null
    })

    const stopChangingEmail = useStable(() => () => {
        updatedAccountInfo.fields.emailAddress.value = null
    })

    const submitNewEmail = useRequest(async () => {
        if (!updatedAccountInfo.fields.emailAddress.isValid) {
            return null
        }

        const { status } = await vibefetch(Store.jwt, '/account/update-email', 'put', {
            email_address: updatedAccountInfo.fields.emailAddress.value!
        })

        if (status === 200) {
            Store.accountInfo.load()
            stopChangingEmail()
        } else {
            throw Error()
        }
    }, { lazy: true })


    const beginChangingPassword = useStable(() => action(() => {
        updatedAccountInfo.fields.password.value = ''
        updatedAccountInfo.fields.passwordConfirmation.value = ''
    }))

    const stopChangingPassword = useStable(() => action(() => {
        updatedAccountInfo.fields.password.value = null
        updatedAccountInfo.fields.passwordConfirmation.value = null
    }))

    const submitNewPassword = useRequest(async () => {
        if (!updatedAccountInfo.fields.password.isValid || !updatedAccountInfo.fields.passwordConfirmation.isValid) {
            return null
        }

        const { status } = await vibefetch(Store.jwt, '/account/update-password', 'put', {
            password: updatedAccountInfo.fields.password.value!
        })

        if (status === 200) {
            stopChangingPassword()
        } else {
            throw Error()
        }
    }, { lazy: true })


    return (
        <Col padding={20} pageLevel justify={loadingOrError ? 'center' : undefined} align={loadingOrError ? 'center' : undefined}>
            {Store.accountInfo.state.kind === 'result' &&
                <h1 style={{ fontSize: 24, alignSelf: 'flex-start' }}>
                    My account
                </h1>}

            <Spacer size={loadingOrError ? 300 : 24} />

            {loading ?
                <LoadingDots size={100} color='var(--color-accent-1)' />
                : Store.accountInfo.state.kind === 'error' || Store.accountInfo.state.result == null ?
                    'Failed to load'
                    : Store.accountInfo.state.kind === 'result' ?
                        <>
                            <Input
                                label='Email address'
                                value={Store.accountInfo.state.result?.email_address}
                                onChange={doNothing}
                                disabled
                            />

                            <Spacer size={8} />

                            <Button onClick={beginChangingEmail}>
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

                            <Button onClick={beginChangingPassword}>
                                Change password
                            </Button>

                            <Spacer size={32} />

                            <Button isDanger isPrimary onClick={Store.logOut}>
                                Log out
                            </Button>
                        </>
                        : null}

            <Modal isOpen={updatedAccountInfo.fields.emailAddress.value != null} onClose={stopChangingEmail}>
                {() =>
                    <form onSubmit={preventingDefault(submitNewEmail.load)}>
                        <Col padding={20} pageLevel>
                            <Input
                                label='New email address'
                                {...fieldToProps(updatedAccountInfo.fields.emailAddress)}
                                value={updatedAccountInfo.fields.emailAddress.value ?? ''}
                            />

                            <Spacer size={24} />

                            <Button isSubmit isPrimary isLoading={submitNewEmail.state.kind === 'loading'} disabled={updatedAccountInfo.fields.emailAddress.value === Store.accountInfo.state.result?.email_address}>
                                Submit
                            </Button>
                        </Col>
                    </form>}
            </Modal>

            <Modal isOpen={updatedAccountInfo.fields.password.value != null} onClose={stopChangingPassword}>
                {() =>
                    <form onSubmit={preventingDefault(submitNewPassword.load)}>
                        <Col padding={20} pageLevel>
                            <Input
                                label='New password'
                                type='password'
                                {...fieldToProps(updatedAccountInfo.fields.password)}
                                value={updatedAccountInfo.fields.password.value ?? ''}
                            />

                            <Spacer size={16} />

                            <Input
                                label='Confirm password'
                                type='password'
                                {...fieldToProps(updatedAccountInfo.fields.passwordConfirmation)}
                                value={updatedAccountInfo.fields.passwordConfirmation.value ?? ''}
                            />

                            <Spacer size={24} />

                            <Button isSubmit isPrimary isLoading={submitNewPassword.state.kind === 'loading'}>
                                Submit
                            </Button>
                        </Col>
                    </form>}
            </Modal>
        </Col>
    )
})
