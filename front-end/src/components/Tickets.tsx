/* eslint-disable indent */
import React, { FC, useCallback, useEffect, useState } from 'react'
import { observer } from 'mobx-react-lite'
import Store from '../Store'
import Modal from './core/Modal'
import Ticket from './Ticket'
import Spacer from './core/Spacer'
import Input from './core/Input'
import Button from './core/Button'
import { DEFAULT_FORM_ERROR,  ObservableForm, form, request, useObservableState } from '../mobx-utils'
import Col from './core/Col'
import { Maybe } from '../../../back-end/common/data'
import { Stripe, StripeElements, StripeElementsOptions, loadStripe } from '@stripe/stripe-js'
import { Elements, PaymentElement, useElements, useStripe } from '@stripe/react-stripe-js'
import env from '../env'
import RowSelect from './core/RowSelect'
import LoadingDots from './core/LoadingDots'
import MultiView from './core/MultiView'
import { vibefetch } from '../vibefetch'

import { MAX_TICKETS_PER_ACCOUNT } from '../../../back-end/common/constants'

const stripePromise = loadStripe(env.STRIPE_PUBLIC_KEY)

export default observer(() => {
    const state = useObservableState(() => ({
        inviteCodeForm: form({
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
        }),
        purchaseForm: form({
            initialValues: {
                adultTickets: 0,
                childTickets: 0
            },
            validators: {},
            submit: async () => {
                state.purchaseState = 'payment'
            }
        }),
        purchaseState: 'none' as 'none' | 'selection' | 'payment'
    }))

    const requestState = useObservableState(() => ({
        stripeOptions: request(async () => {
            const adultTickets = state.purchaseForm.fields.adultTickets.value
            const childTickets = state.purchaseForm.fields.childTickets.value

            if (adultTickets > 0 || childTickets > 0) {
                const stripe_client_secret = (await vibefetch(
                    Store.jwt, 
                    '/ticket/create-purchase-intent', 
                    'post',
                    {
                        adult_tickets: state.purchaseForm.fields.adultTickets.value,
                        child_tickets: state.purchaseForm.fields.childTickets.value
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
        }),
    }))

    return (
        <Col padding={20}>
            <h1>My tickets</h1>

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
                                : <form onSubmit={state.inviteCodeForm.handleSubmit}>
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
                                            value={state.inviteCodeForm.fields.code.value}
                                            onChange={state.inviteCodeForm.fields.code.set}
                                            error={state.inviteCodeForm.fields.code.error}
                                            onBlur={state.inviteCodeForm.fields.code.activateValidation}
                                        />

                                        {state.inviteCodeForm.error &&
                                            <>
                                                <Spacer size={8} />

                                                <div style={{ color: 'red' }}>
                                                    {state.inviteCodeForm.error}
                                                </div>
                                            </>}

                                        <Spacer size={8} />

                                        <Button isSubmit isPrimary isLoading={state.inviteCodeForm.submitting}>
                                            Enter invite code
                                        </Button>
                                    </Col>
                                </form>}
                        </>
                        : null}

            <Modal title='Ticket purchase' isOpen={state.purchaseState !== 'none'} onClose={() => state.purchaseState = 'none'}>
                <MultiView
                    views={[
                        { name: 'selection', content: <SelectionView purchaseForm={state.purchaseForm} /> },
                        { name: 'payment', content: <PaymentView stripeOptions={requestState.stripeOptions.state.result} /> }
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

const PaymentView: FC<{ stripeOptions: StripeElementsOptions | undefined }> = observer(({ stripeOptions }) => {
    if (stripeOptions == null) {
        return null
    }

    return (
        <Elements options={stripeOptions} stripe={stripePromise}>
            <PaymentForm />
        </Elements>
    )
})

const PaymentForm: FC = observer(() => {
    const stripe = useStripe()
    const elements = useElements() ?? undefined

    const state = useObservableState({
        paymentForm: form({
            initialValues: {
                stripe: null as Stripe | null,
                elements: undefined as StripeElements | undefined,
            },
            validators: {},
            submit: async ({ stripe, elements }) => {
                if (!stripe) {
                    console.error('Stripe not initialized yet')
                    return
                }

                // @ts-expect-error foo
                const { error } = await stripe.confirmPayment({
                    elements,
                    confirmParams: {
                        return_url: location.origin + '#Tickets',
                    },
                })

                // This point will only be reached if there is an immediate error when
                // confirming the payment. Otherwise, your customer will be redirected to
                // your `return_url`. For some payment methods like iDEAL, your customer will
                // be redirected to an intermediate site first to authorize the payment, then
                // redirected to the `return_url`.
                if (error.type === 'card_error' || error.type === 'validation_error') {
                    return error.message
                } else {
                    return 'An unexpected error occurred.'
                }
            }
        })
    })

    useEffect(() => {
        state.paymentForm.fields.stripe.set(stripe)
    }, [stripe])
    useEffect(() => {
        state.paymentForm.fields.elements.set(elements)
    }, [elements])

    return (
        !stripe || !elements
            ? <LoadingDots />
            : <form id="payment-form" onSubmit={state.paymentForm.handleSubmit}>
                <Col>
                    <PaymentElement id="payment-element" options={{ layout: 'tabs' }} />

                    <Spacer size={16} />

                    {state.paymentForm.error &&
                        state.paymentForm.error}

                    <Spacer size={8} />

                    <Button isSubmit isPrimary isLoading={state.paymentForm.submitting}>
                        Pay now
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