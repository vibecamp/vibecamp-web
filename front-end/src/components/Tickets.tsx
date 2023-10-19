/* eslint-disable indent */
import React, { FC, useCallback, useState } from 'react'
import { observer } from 'mobx-react-lite'
import Store from '../Store'
import Modal from './core/Modal'
import Ticket from './Ticket'
import Spacer from './core/Spacer'
import Input from './core/Input'
import Button from './core/Button'
import { DEFAULT_FORM_ERROR, ObservableForm, useForm, useObservableState, useRequest } from '../mobx-utils'
import Col from './core/Col'
import { Maybe } from '../../../back-end/common/data'
import RowSelect from './core/RowSelect'
import MultiView from './core/MultiView'
import { vibefetch } from '../vibefetch'

import { MAX_TICKETS_PER_ACCOUNT } from '../../../back-end/common/constants'
import StripePaymentForm from './core/StripePaymentForm'

export default observer(() => {
    const inviteCodeForm = useForm({
        initialValues: {
            code: ''
        },
        validators: {},
        submit: async ({ code }) => {
            const success = await vibefetch(Store.jwt, '/account/submit-invite-code', 'post', { invite_code: code })

            if (!success) {
                return DEFAULT_FORM_ERROR
            }
        }
    })

    const purchaseForm = useForm({
        initialValues: {
            adultTickets: 0,
            childTickets: 0
        },
        validators: {},
        submit: async () => {
            state.purchaseState = 'payment'
        }
    })

    const state = useObservableState({
        purchaseState: 'none' as 'none' | 'selection' | 'payment'
    })

    const stripeOptions = useRequest(async () => {
        const adultTickets = purchaseForm.fields.adultTickets.value
        const childTickets = purchaseForm.fields.childTickets.value

        if (adultTickets > 0 || childTickets > 0) {
            const stripe_client_secret = (await vibefetch(
                Store.jwt, 
                '/ticket/create-purchase-intent', 
                'post',
                {
                    adult_tickets: purchaseForm.fields.adultTickets.value,
                    child_tickets: purchaseForm.fields.childTickets.value
                }
            ))?.stripe_client_secret

            return {
                clientSecret: stripe_client_secret,
                appearance: {
                    theme: 'stripe' as const
                }
            }
        } else {
            return undefined
        }
    })

    return (
        <Col padding={20}>
            <h1 style={{ fontSize: 24 }}>My tickets</h1>

            <Spacer size={16} />

            {Store.accountInfo.state.kind === 'loading' ?
                'Loading...'
                : Store.accountInfo.state.kind === 'error' || Store.accountInfo.state.result == null ?
                    'Failed to load'
                    : Store.accountInfo.state.kind === 'result' ?
                        <>
                            {Store.accountInfo.state.result.allowed_to_purchase_tickets
                                ? <>
                                    {Store.accountInfo.state.result?.tickets.map(ticket =>
                                        <React.Fragment key={ticket.ticket_id}>
                                            <Ticket name='Unknown attendee' ticketType='adult' />
                                            <Spacer size={16} />
                                        </React.Fragment>)}

                                    <Button isPrimary isDisabled={Store.accountInfo.state.result.tickets.length >= MAX_TICKETS_PER_ACCOUNT.adult} onClick={() => state.purchaseState = 'selection'}>
                                        Buy {Store.accountInfo.state.result.tickets.length > 0 && 'more'} tickets
                                    </Button>

                                    {Store.accountInfo.state.result.inviteCodes.length > 0 &&
                                        <>
                                            <Spacer size={32} />

                                            <hr />

                                            <Spacer size={32} />

                                            <h2>
                                                Your invite codes
                                            </h2>

                                            <Spacer size={8} />

                                            <div>
                                                You can give these to other people you know and
                                                trust, to allow them to buy tickets
                                            </div>

                                            <Spacer size={16} />

                                            {Store.accountInfo.state.result.inviteCodes.map(({ code, used_by }, index) => <React.Fragment key={index}>
                                                {index > 0 && <Spacer size={16} />}

                                                <InviteCode code={code} usedBy={used_by} />
                                            </React.Fragment>)}
                                        </>}
                                </>
                                : <form onSubmit={inviteCodeForm.handleSubmit}>
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

                                        <Spacer size={16} />

                                        <Input
                                            label='Invite code'
                                            value={inviteCodeForm.fields.code.value}
                                            onChange={inviteCodeForm.fields.code.set}
                                            error={inviteCodeForm.fields.code.error}
                                            onBlur={inviteCodeForm.fields.code.activateValidation}
                                        />

                                        {inviteCodeForm.error &&
                                            <>
                                                <Spacer size={8} />

                                                <div style={{ color: 'red' }}>
                                                    {inviteCodeForm.error}
                                                </div>
                                            </>}

                                        <Spacer size={8} />

                                        <Button isSubmit isPrimary isLoading={inviteCodeForm.submitting}>
                                            Enter invite code
                                        </Button>
                                    </Col>
                                </form>}
                        </>
                        : null}

            <Modal title='Ticket purchase' isOpen={state.purchaseState !== 'none'} onClose={() => state.purchaseState = 'none'}>
                <MultiView
                    views={[
                        { name: 'selection', content: <SelectionView purchaseForm={purchaseForm} /> },
                        { name: 'payment', content: <StripePaymentForm stripeOptions={stripeOptions.state.result} redirectUrl={location.origin + '#Tickets'} /> }
                    ]}
                    currentView={state.purchaseState}
                />
            </Modal>
        </Col>
    )
})

const SelectionView: FC<{ purchaseForm: ObservableForm<{ adultTickets: number, childTickets: number }> }> = observer(({ purchaseForm }) => {

    return (
        <form onSubmit={purchaseForm.handleSubmit}>
            <Col>
                You currently have:
                <div>
                    {Store.accountInfo.state.result?.tickets.length} adult tickets, and
                </div>
                <div>
                    {0} child tickets
                </div>

                <Spacer size={16} />

                <RowSelect
                    label='Adult tickets to purchase'
                    value={purchaseForm.fields.adultTickets.value}
                    onChange={purchaseForm.fields.adultTickets.set}
                    options={new Array(MAX_TICKETS_PER_ACCOUNT.adult + 1).fill(null).map((_, index) => index)}
                />

                <Spacer size={16} />

                <RowSelect
                    label='Child tickets to purchase'
                    value={purchaseForm.fields.childTickets.value}
                    onChange={purchaseForm.fields.childTickets.set}
                    options={new Array(MAX_TICKETS_PER_ACCOUNT.child + 1).fill(null).map((_, index) => index)}
                />

                <Spacer size={24} />

                <Button isSubmit isPrimary isDisabled={purchaseForm.fields.adultTickets.value <= 0 && purchaseForm.fields.childTickets.value <= 0}>
                    Purchase
                </Button>
            </Col>
        </form>
    )
})

const InviteCode: FC<{ code: string, usedBy: Maybe<string> }> = observer(({ code, usedBy }) => {
    const [copied, setCopied] = useState(false)

    const copy = useCallback(async () => {
        await navigator.clipboard.writeText(code)
        setCopied(true)
    }, [code])

    return (
        <div className={'invite-code' + ' ' + (usedBy != null ? 'used' : '')}>
            <div className='code-widget'>
                <div className='code'>
                    {code}
                </div>

                <button onClick={copy}>
                    {copied
                        ? '✓'
                        : '⎘'}
                </button>
            </div>


            <div className='used-by'>
                {usedBy != null && `Used by ${usedBy}`}
            </div>
        </div>
    )
})