import React, { useCallback, useEffect, useMemo, useState } from 'react'

import { Tables } from '../../../back-end/types/db-types'
import { getEmailValidationError, getPasswordValidationError } from '../../../back-end/utils/validation'
import useForm, { fieldToProps } from '../hooks/useForm'
import { usePromise } from '../hooks/usePromise'
import { useStore } from '../hooks/useStore'
import { DEFAULT_FORM_ERROR, doNothing, preventingDefault } from '../utils'
import { vibefetch } from '../vibefetch'
import { BadgeInfoForm } from './BadgeInfoForm'
import Button from './core/Button'
import Col from './core/Col'
import ErrorMessage from './core/ErrorMessage'
import Input from './core/Input'
import LoadingDots from './core/LoadingDots'
import Modal from './core/Modal'
import Spacer from './core/Spacer'
import AttendeeInfoForm, { Props as AttendeeInfoFormProps } from './tickets/AttendeeInfoForm'

export default React.memo(() => {
    const store = useStore()
    const loading = store.accountInfo.state.kind === 'loading'
    const loadingOrError = loading || store.accountInfo.state.kind === 'error'

    const [primaryAttendee, setPrimaryAttendee] = useState(store.primaryAttendee)
    const [primaryAttendeeModified, setPrimaryAttendeeModified] = useState(false)

    useEffect(() => {
        setPrimaryAttendee(store.primaryAttendee)
    }, [store.primaryAttendee])

    const setAttendeeProperty = useCallback<AttendeeInfoFormProps['setAttendeeProperty']>((_, property, value) => {
        if (primaryAttendee) {
            setPrimaryAttendee({ ...primaryAttendee, [property]: value })
            setPrimaryAttendeeModified(true)
        }
    }, [primaryAttendee])

    const saveAttendeeInfo = usePromise(async () => {
        if (primaryAttendee) {
            const { status, body } = await vibefetch(store.jwt, '/account/update-attendee', 'put', primaryAttendee)

            if (status !== 200 || body == null) {
                return DEFAULT_FORM_ERROR
            }

            setPrimaryAttendee(body)
            setPrimaryAttendeeModified(false)
        }
    }, [primaryAttendee, store.jwt], { lazy: true })

    const handleAttendeeFormSubmit = useMemo(() => preventingDefault(saveAttendeeInfo.load), [saveAttendeeInfo.load])

    const [editing, setEditing] = useState<'none' | 'email' | 'password'>('none')
    const stopEditing = useCallback(() => setEditing('none'), [])

    const badges = useMemo(() => {
        const accountInfo = store.accountInfo.state.result
        const festivals = store.festivals.state.result
        if (accountInfo == null || festivals == null) {
            return []
        }

        return festivals
            .filter(festival => {
                const tickets = store.purchasedTicketsByFestival[festival.festival_id] ?? []
                return !festival.pre_badge_integration && tickets.length > 0
            })
            .map(({ festival_id, festival_name }) => ({
                festival_id,
                festival_name,
                attendees: accountInfo.attendees
                    .map(({ attendee_id, name }) => ({
                        attendee_id,
                        attendee_name: name,
                        badge_exists: accountInfo.badges.some(badge => badge.festival_id === festival_id && badge.attendee_id === attendee_id)
                    }))
            }))
    }, [store.accountInfo.state.result, store.festivals.state.result, store.purchasedTicketsByFestival])

    const [editingBadge, setEditingBadge] = useState<{ festival_id: Tables['festival']['festival_id'], attendee_id: Tables['attendee']['attendee_id'] }>()

    return (
        <Col padding={20} pageLevel justify={loadingOrError ? 'center' : undefined} align={loadingOrError ? 'center' : undefined}>
            {store.accountInfo.state.kind === 'result' &&
                <h1 style={{ fontSize: 24, alignSelf: 'flex-start' }}>
                    My account
                </h1>}

            <Spacer size={loadingOrError ? 300 : 24} />

            {loading
                ? <LoadingDots size={100} color='var(--color-accent-1)' />
                : store.accountInfo.state.kind === 'error' || store.accountInfo.state.result == null
                    ? 'Failed to load'
                    : <>
                        {primaryAttendee != null&&
                            <form onSubmit={handleAttendeeFormSubmit}>
                                <AttendeeInfoForm
                                    attendeeInfo={primaryAttendee}
                                    attendeeErrors={{}}
                                    setAttendeeProperty={setAttendeeProperty}
                                    isChild={false}
                                    festival={undefined}
                                />

                                <Spacer size={24} />

                                <Button
                                    isSubmit
                                    isPrimary
                                    isLoading={saveAttendeeInfo.state.kind === 'loading'}
                                    disabled={!primaryAttendeeModified}
                                >
                                    Update my info
                                </Button>

                                {saveAttendeeInfo.state.error != null &&
                                    <>
                                        <Spacer size={16} />

                                        <ErrorMessage error={DEFAULT_FORM_ERROR} />
                                    </>}

                                <Spacer size={32} />

                                <hr />

                                <Spacer size={32} />
                            </form>}

                        <h2 style={{ fontSize: 18, alignSelf: 'flex-start' }}>
                            Badge info
                        </h2>

                        <Spacer size={16} />

                        {badges.map(({ festival_id, festival_name, attendees }, festival_index) =>
                            <div key={festival_id}>
                                {festival_index > 0 && <Spacer size={16} />}

                                <h3>{festival_name}</h3>
                                <Spacer size={8} />
                                <div style={{ border: 'var(--controls-border)', borderRadius: 4, background: 'var(--color-background-2)' }}>
                                    {attendees.map(({ attendee_id, attendee_name, badge_exists }, i) =>
                                        <div style={{ padding: '4px 8px', borderTop: i > 0 ? 'var(--controls-border)' : undefined, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }} key={attendee_id}>
                                            {attendee_name}&apos;s badge

                                            <Button isPrimary={!badge_exists} isCompact style={{ flexGrow: 0, flexShrink: 0, width: 'auto' }} onClick={() => setEditingBadge({ festival_id, attendee_id })}>
                                                {badge_exists ? 'Edit' : 'Add'}
                                            </Button>
                                        </div>)}
                                </div>
                            </div>)}

                        <Modal side='right' isOpen={editingBadge != null} onClose={() => setEditingBadge(undefined)}>
                            {() => editingBadge && <BadgeInfoForm {...editingBadge} onSubmitted={() => setEditingBadge(undefined)} />}
                        </Modal>

                        <Spacer size={32} />

                        <hr />

                        <Spacer size={32} />

                        <Input
                            label='Email address'
                            value={store.accountInfo.state.result?.email_address}
                            onChange={doNothing}
                            disabled
                        />

                        <Spacer size={8} />

                        <Button onClick={() => setEditing('email')}>
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

                        <Button onClick={() => setEditing('password')}>
                            Change password
                        </Button>

                        <Spacer size={32} />

                        <Button isDanger isPrimary onClick={store.logOut}>
                            Log out
                        </Button>
                    </>}

            <Modal isOpen={editing === 'email'} onClose={stopEditing} side='right'>
                {() => <EmailAddressEditor stopEditing={stopEditing} />}
            </Modal>

            <Modal isOpen={editing === 'password'} onClose={stopEditing} side='right'>
                {() => <PasswordEditor stopEditing={stopEditing} />}
            </Modal>
        </Col>
    )
})

const EmailAddressEditor = React.memo(({ stopEditing }: { stopEditing: () => void }) => {
    const store = useStore()

    const emailAddressForm = useForm({
        initial: {
            emailAddress: store.accountInfo.state.result?.email_address ?? ''
        },
        validators: {
            emailAddress: getEmailValidationError
        },
        submit: async ({ emailAddress }) => {
            const { status } = await vibefetch(store.jwt, '/account/update-email', 'put', {
                email_address: emailAddress
            })

            if (status !== 200) {
                return DEFAULT_FORM_ERROR
            }

            await store.accountInfo.load()
            stopEditing()
        }
    })

    return (
        <form onSubmit={emailAddressForm.handleSubmit} noValidate>
            <Col padding={20} pageLevel>
                <Input
                    label='New email address'
                    {...fieldToProps(emailAddressForm.fields.emailAddress)}
                />

                <Spacer size={24} />

                <Button isSubmit isPrimary isLoading={emailAddressForm.submitting} disabled={emailAddressForm.fields.emailAddress.value === store.accountInfo.state.result?.email_address}>
                                Submit
                </Button>
            </Col>
        </form>
    )
})

const PasswordEditor = React.memo(({ stopEditing }: { stopEditing: () => void }) => {
    const store = useStore()

    const passwordForm = useForm({
        initial: {
            password: '',
            passwordConfirmation: ''
        },
        validators: {
            password: getPasswordValidationError,
            passwordConfirmation: (passwordConfirmation, { password }) => {
                if (password !== passwordConfirmation) {
                    return 'Passwords don\'t match'
                }
            }
        },
        submit: async ({ password }) => {
            const { status } = await vibefetch(store.jwt, '/account/update-password', 'put', {
                password
            })

            if (status !== 200) {
                return DEFAULT_FORM_ERROR
            }

            await store.accountInfo.load()
            stopEditing()
        }
    })

    return (
        <form onSubmit={passwordForm.handleSubmit} noValidate>
            <Col padding={20} pageLevel>
                <Input
                    label='New password'
                    type='password'
                    {...fieldToProps(passwordForm.fields.password)}
                />

                <Spacer size={16} />

                <Input
                    label='Confirm password'
                    type='password'
                    {...fieldToProps(passwordForm.fields.passwordConfirmation)}
                />

                <Spacer size={24} />

                <Button isSubmit isPrimary isLoading={passwordForm.submitting}>
                                Submit
                </Button>
            </Col>
        </form>
    )
})