import React from 'react'
import { observer } from 'mobx-react-lite'
import { setter } from '../../mobx/misc'
import { preventingDefault, DEFAULT_FORM_ERROR } from '../../utils'
import Button from '../core/Button'
import Col from '../core/Col'
import ErrorMessage from '../core/ErrorMessage'
import Input from '../core/Input'
import Spacer from '../core/Spacer'
import { useRequest, useStable } from '../../mobx/hooks'
import { Form, fieldToProps } from '../../mobx/form'
import { getUuidValidationError } from '../../../../back-end/utils/validation'
import Store from '../../Store'
import { vibefetch } from '../../vibefetch'


export default observer(() => {
    const state = useStable(() => new Form({
        initialValues: {
            code: ''
        },
        validators: {
            code: getUuidValidationError
        }
    }))

    const submitInviteCode = useRequest(async () => {
        if (!state.isValid) {
            throw 'Invalid invite code'
        }

        const { status } = await vibefetch(Store.jwt, '/account/submit-invite-code', 'post', { invite_code: state.fields.code.value })

        if (status === 404) {
            throw 'Invalid invite code'
        }

        if (status === 403) {
            throw 'This invite code has already been used'
        }

        if (status !== 200) {
            throw DEFAULT_FORM_ERROR
        }

        await Store.accountInfo.load()
    }, { lazy: true })

    return (
        <form onSubmit={preventingDefault(submitInviteCode.load)}>
            <Col>
                <h2>
                    Welcome!
                </h2>

                <Spacer size={8} />

                <div>
                    Someone else will need to refer you by giving
                    you an invite code before you can buy tickets
                    for the current event.
                </div>

                <Spacer size={24} />

                <Input
                    label='Invite code'
                    placeholder='11111111-1111-1111-1111-111111111111'
                    {...fieldToProps(state.fields.code)}
                />

                <ErrorMessage
                    error={submitInviteCode.state.kind === 'error' ? (
                        typeof submitInviteCode.state.error === 'string'
                            ? submitInviteCode.state.error
                            : DEFAULT_FORM_ERROR
                    ) : undefined}
                />

                <Spacer size={8} />

                <Button isSubmit isPrimary isLoading={submitInviteCode.state.kind === 'loading'}>
                    Use invite code
                </Button>
            </Col>
        </form>
    )
})