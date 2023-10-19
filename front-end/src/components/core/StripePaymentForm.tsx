import { useStripe, useElements, PaymentElement, Elements } from '@stripe/react-stripe-js'
import { observer } from 'mobx-react-lite'
import React, { FC } from 'react'
import { useRequest } from '../../mobx-utils'
import Button from './Button'
import Col from './Col'
import LoadingDots from './LoadingDots'
import Spacer from './Spacer'
import { StripeElementsOptions, loadStripe } from '@stripe/stripe-js'
import env from '../../env'

const stripePromise = loadStripe(env.STRIPE_PUBLIC_KEY)

type Props = {
    stripeOptions: StripeElementsOptions | undefined,
    redirectUrl: string
}

export default observer(({ stripeOptions, redirectUrl }: Props) => {
    if (stripeOptions == null) {
        return null
    }

    return (
        <Elements options={stripeOptions} stripe={stripePromise}>
            <PaymentFormInner redirectUrl={redirectUrl} />
        </Elements>
    )
})

const PaymentFormInner: FC<{ redirectUrl: string }> = observer(({ redirectUrl }) => {
    const stripe = useStripe()
    const elements = useElements()

    const confirmPayment = useRequest(async () => {
        if (!stripe || !elements) {
            console.error('Stripe not initialized yet')
            return
        }

        const { error } = await stripe.confirmPayment({
            elements,
            confirmParams: {
                return_url: redirectUrl,
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
    }, [elements, redirectUrl, stripe], { lazy: true })

    return (
        !stripe || !elements
            ? <LoadingDots />
            : <form id="payment-form" onSubmit={confirmPayment.load}>
                <Col>
                    <PaymentElement id="payment-element" options={{ layout: 'tabs' }} />

                    <Spacer size={16} />

                    {confirmPayment.state.result &&
                        confirmPayment.state.result}

                    <Spacer size={8} />

                    <Button isSubmit isPrimary isLoading={confirmPayment.state.kind === 'loading'}>
                        Pay now
                    </Button>
                </Col>
            </form>
    )
})
