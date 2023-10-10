/* eslint-disable indent */
import React, { FC, FormEvent, useCallback, useEffect, useState } from 'react'
import { observer } from 'mobx-react-lite'
import Store from '../Store'
import Modal from './core/Modal'
import Ticket from './Ticket'
import Spacer from './core/Spacer'
import Input from './core/Input'
import Button from './core/Button'
import { DEFAULT_FORM_ERROR, form, request, useObservableState } from '../mobx-utils'
import Col from './core/Col'
import { submitInviteCode } from '../api/account'
import { Maybe } from '../../../back-end/common/data'
import { Stripe, StripeElements, StripePaymentElementChangeEvent, loadStripe } from '@stripe/stripe-js'
import { Elements, LinkAuthenticationElement, PaymentElement, useElements, useStripe } from '@stripe/react-stripe-js'
import env from '../env'
import { createTicketPurchaseIntent } from '../api/ticket'
import RowSelect from './core/RowSelect'
import LoadingDots from './core/LoadingDots'

const stripePromise = loadStripe(env.STRIPE_PUBLIC_KEY)

export default observer(() => {
    const state = useObservableState(() => ({
        inviteCodeForm: form({
            initialValues: {
                code: ''
            },
            validators: {},
            submit: async ({ code }) => {
                const success = await submitInviteCode(Store.jwt, code)

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
        stripeOptions: request(async () => {
            const adultTickets = state.purchaseForm.fields.adultTickets.value
            const childTickets = state.purchaseForm.fields.childTickets.value

            if (adultTickets > 0 || childTickets > 0) {
                const clientSecret = await createTicketPurchaseIntent(Store.jwt, {
                    adultTickets: state.purchaseForm.fields.adultTickets.value,
                    childTickets: state.purchaseForm.fields.childTickets.value
                })

                return {
                    clientSecret,
                    appearance: {
                        theme: 'stripe' as const
                    }
                }
            } else {
                return undefined
            }
        }),
        purchaseState: 'none' as 'none' | 'selection' | 'payment'
    }))

    console.log({ stripeOptionsState: state.stripeOptions.state })

    const ticketNumOptions = new Array(Store.accountInfo.state.result?.allowed_to_purchase_tickets).fill(null).map((_, index) => index)

    return (
        <Col>
            <h1>My tickets</h1>

            <Spacer size={16} />

            {Store.accountInfo.state.kind === 'loading' ?
                'Loading...'
                : Store.accountInfo.state.kind === 'error' || Store.accountInfo.state.result == null ?
                    'Failed to load'
                    : Store.accountInfo.state.kind === 'result' ?
                        <>
                            {Store.accountInfo.state.result.allowed_to_purchase_tickets > 0
                                ? <>
                                    {Store.accountInfo.state.result?.tickets.map(ticket =>
                                        <Ticket name='Unknown attendee' ticketType='adult' key={ticket.ticket_id} />)}

                                    <Button isPrimary isDisabled={Store.accountInfo.state.result.tickets.length >= Store.accountInfo.state.result.allowed_to_purchase_tickets} onClick={() => state.purchaseState = 'selection'}>
                                        Buy tickets
                                    </Button>

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

                                    {[
                                        { code: '11111111-1111-1111-1111-111111111111', usedBy: 'My friend' },
                                        { code: '22222222-2222-2222-2222-222222222222', usedBy: null },
                                        { code: '33333333-3333-3333-3333-333333333333', usedBy: null },
                                        { code: '44444444-4444-4444-4444-444444444444', usedBy: null }
                                    ].map(({ code, usedBy }, index) => <React.Fragment key={index}>
                                        {index > 0 && <Spacer size={16} />}

                                        <InviteCode code={code} usedBy={usedBy} />
                                    </React.Fragment>)}
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
                {state.purchaseState === 'selection' ?
                    <form onSubmit={state.purchaseForm.handleSubmit}>
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
                                value={state.purchaseForm.fields.adultTickets.value}
                                onChange={state.purchaseForm.fields.adultTickets.set}
                                options={ticketNumOptions}
                            />

                            <Spacer size={16} />

                            <RowSelect
                                label='Child tickets to purchase'
                                value={state.purchaseForm.fields.childTickets.value}
                                onChange={state.purchaseForm.fields.childTickets.set}
                                options={ticketNumOptions}
                            />

                            <Spacer size={24} />

                            <Button isSubmit isPrimary isDisabled={state.purchaseForm.fields.adultTickets.value <= 0 && state.purchaseForm.fields.childTickets.value <= 0}>
                                Purchase
                            </Button>
                        </Col>
                    </form>
                    : state.purchaseState === 'payment' ?
                        state.stripeOptions.state.result != null &&
                        <Elements options={state.stripeOptions.state.result} stripe={stripePromise}>
                            <PaymentForm clientSecret={state.stripeOptions.state.result.clientSecret} />
                        </Elements>
                        : null}
            </Modal>
        </Col>
    )
})

const PaymentForm: FC<{ clientSecret: string }> = React.memo(({ clientSecret }) => {
    const stripe = useStripe()
    const elements = useElements() ?? undefined

    const state = useObservableState({
        paymentForm: form({
            initialValues: {
                stripe: null as Stripe | null,
                elements: undefined as StripeElements | undefined,
            },
            validators: {},
            submit: async ({ stripe }) => {
                console.log('submit')
                if (!stripe) {
                    console.error('Stripe not initialized yet')
                    return
                }
                console.log({ stripe })

                console.log('stripe.confirmPayment', {
                    elements,
                    confirmParams: {
                        return_url: location.href + '#Tickets',
                    },
                })
                // @ts-expect-error foo
                const { error } = await stripe.confirmPayment({
                    elements,
                    confirmParams: {
                        return_url: location.href + '#Tickets',
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

const InviteCode: FC<{ code: string, usedBy: Maybe<string> }> = React.memo(({ code, usedBy }) => {
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