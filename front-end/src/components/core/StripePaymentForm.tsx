import { useStripe, useElements, PaymentElement, Elements } from '@stripe/react-stripe-js'
import { observer } from 'mobx-react-lite'
import React, { FC } from 'react'
import Button from './Button'
import Col from './Col'
import LoadingDots from './LoadingDots'
import Spacer from './Spacer'
import { StripeElementsOptions, loadStripe } from '@stripe/stripe-js'
import env from '../../env'
import { useRequestWithDependencies } from '../../mobx/hooks'
import { preventingDefault } from '../../utils'
import PriceBreakdown from '../PriceBreakdown'
import { Purchases } from '../../../../back-end/types/route-types'
import ErrorMessage from './ErrorMessage'

const stripePromise = loadStripe(env.STRIPE_PUBLIC_KEY)

type Props = {
    stripeOptions: StripeElementsOptions | undefined,
    purchases?: Purchases,
    onPrePurchase?: () => Promise<void> | void,
    onCompletePurchase?: () => void,
}

export default observer(({ stripeOptions, ...otherProps }: Props) => {
    if (stripeOptions == null) {
        return null
    }

    return (
        <Elements options={stripeOptions} stripe={stripePromise}>
            <PaymentFormInner {...otherProps} />
        </Elements>
    )
})

const PaymentFormInner: FC<Omit<Props, 'stripeOptions'>> = observer(({ purchases, onPrePurchase, onCompletePurchase }) => {
    const stripe = useStripe()
    const elements = useElements()

    const confirmPayment = useRequestWithDependencies(async () => {
        if (!stripe || !elements) {
            console.error('Stripe not initialized yet')
            return
        }

        await onPrePurchase?.()

        const { error } = await stripe.confirmPayment({
            elements,
            confirmParams: {
                return_url: location.origin,
            },
            redirect: 'if_required'
        })

        // This point will only be reached if there is an immediate error when
        // confirming the payment. Otherwise, your customer will be redirected to
        // your `return_url`. For some payment methods like iDEAL, your customer will
        // be redirected to an intermediate site first to authorize the payment, then
        // redirected to the `return_url`.
        if (error?.type === 'card_error' || error?.type === 'validation_error') {
            return error.message
        } else if (error != null) {
            return 'An unexpected error occurred.'
        } else {
            onCompletePurchase()
        }
    }, [stripe, elements, onPrePurchase, onCompletePurchase], { lazy: true })

    return (
        !stripe || !elements
            ? <LoadingDots size={60} color='var(--color-accent-1)' />
            : <form id="payment-form" onSubmit={preventingDefault(confirmPayment.load)}>
                <Col padding={20} pageLevel>
                    <PaymentElement id="payment-element" options={{ layout: 'tabs' }} />

                    {purchases &&
                        <>
                            <Spacer size={16} />

                            <PriceBreakdown purchases={purchases} />
                        </>}

                    <Spacer size={16} />

                    <ErrorMessage error={confirmPayment.state.result} />

                    <Spacer size={8} />

                    <Button isSubmit isPrimary isLoading={confirmPayment.state.kind === 'loading'}>
                        Pay now
                    </Button>
                </Col>
            </form>
    )
})
