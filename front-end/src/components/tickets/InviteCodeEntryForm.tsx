import React, { useState } from 'react'

import { getUuidValidationError } from '../../../../back-end/utils/validation'
import { usePromise } from '../../hooks/usePromise'
import { useStore } from '../../hooks/useStore'
import { DEFAULT_FORM_ERROR,preventingDefault } from '../../utils'
import { vibefetch } from '../../vibefetch'
import Button from '../core/Button'
import Col from '../core/Col'
import ErrorMessage from '../core/ErrorMessage'
import Input from '../core/Input'
import Spacer from '../core/Spacer'

export default React.memo(() => {
    const store = useStore()
    const [code, setCode] = useState('')

    const codeError = getUuidValidationError(code)

    const submitInviteCode = usePromise(async () => {
        if (codeError) {
            return { fieldError: true }
        }

        const { status } = await vibefetch(store.jwt, '/account/submit-invite-code', 'post', { invite_code: code })

        if (status === 404) {
            return { submissionError: 'Invalid invite code' }
        }

        if (status === 403) {
            return { submissionError: 'This invite code has already been used' }
        }

        if (status !== 200) {
            return { submissionError: DEFAULT_FORM_ERROR }
        }

        await store.accountInfo.load()
    }, [code, codeError, store.accountInfo, store.jwt], { lazy: true })

    return (
        <form onSubmit={preventingDefault(submitInviteCode.load)} noValidate>
            <Col>
                <Input
                    label='Invite code'
                    placeholder='11111111-1111-1111-1111-111111111111'
                    value={code}
                    onChange={setCode}
                    error={submitInviteCode.state.result?.fieldError ? codeError : undefined}
                />

                <ErrorMessage error={
                    submitInviteCode.state.kind === 'error'
                        ? DEFAULT_FORM_ERROR
                        : submitInviteCode.state.result?.submissionError
                } />

                <Spacer size={8} />

                <Button isSubmit isPrimary isLoading={submitInviteCode.state.kind === 'loading'}>
                    Use invite code
                </Button>
            </Col>
        </form>
    )
})