import React from 'react'

import { getUuidValidationError } from '../../../../back-end/utils/validation'
import { useObservableClass } from '../../mobx/hooks'
import { observer, setter } from '../../mobx/misc'
import { request } from '../../mobx/request'
import Store from '../../stores/Store'
import { DEFAULT_FORM_ERROR,preventingDefault } from '../../utils'
import { vibefetch } from '../../vibefetch'
import Button from '../core/Button'
import Col from '../core/Col'
import ErrorMessage from '../core/ErrorMessage'
import Input from '../core/Input'
import Spacer from '../core/Spacer'

export default observer(() => {
    const state = useObservableClass(class {
        code = ''

        get codeError() {
            return getUuidValidationError(this.code)
        }

        readonly submitInviteCode = request(async () => {
            if (this.codeError) {
                return { fieldError: true }
            }

            const { status } = await vibefetch(Store.jwt, '/account/submit-invite-code', 'post', { invite_code: this.code })

            if (status === 404) {
                return { submissionError: 'Invalid invite code' }
            }

            if (status === 403) {
                return { submissionError: 'This invite code has already been used' }
            }

            if (status !== 200) {
                return { submissionError: DEFAULT_FORM_ERROR }
            }

            await Store.accountInfo.load()
        }, { lazy: true })
    })

    return (
        <form onSubmit={preventingDefault(state.submitInviteCode.load)} noValidate>
            <Col>
                <Input
                    label='Invite code'
                    placeholder='11111111-1111-1111-1111-111111111111'
                    value={state.code}
                    onChange={setter(state, 'code')}
                    error={state.submitInviteCode.state.result?.fieldError ? state.codeError : undefined}
                />

                <ErrorMessage error={
                    state.submitInviteCode.state.kind === 'error'
                        ? DEFAULT_FORM_ERROR
                        : state.submitInviteCode.state.result?.submissionError
                } />

                <Spacer size={8} />

                <Button isSubmit isPrimary isLoading={state.submitInviteCode.state.kind === 'loading'}>
                    Use invite code
                </Button>
            </Col>
        </form>
    )
})