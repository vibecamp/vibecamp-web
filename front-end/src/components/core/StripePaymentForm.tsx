import { Elements,PaymentElement, useElements, useStripe } from '@stripe/react-stripe-js'
import { loadStripe,StripeElementsOptions } from '@stripe/stripe-js'
import React, { FC, useMemo } from 'react'

import { Purchases } from '../../../../back-end/types/route-types'
import env from '../../env'
import usePrefersDarkTheme from '../../hooks/usePrefersDarkTheme'
import { usePromise } from '../../hooks/usePromise'
import { preventingDefault } from '../../utils'
import PriceBreakdown from '../tickets/PriceBreakdown'
import Button from './Button'
import Col from './Col'
import ErrorMessage from './ErrorMessage'
import LoadingDots from './LoadingDots'
import Spacer from './Spacer'

const stripePromise = loadStripe(env.STRIPE_PUBLIC_KEY)

type Props = {
    stripeOptions: StripeElementsOptions | undefined,
    purchases: Purchases,
    discountCode: string,
    onCompletePurchase?: () => Promise<void> | void,
}

export default React.memo(({ stripeOptions, ...otherProps }: Props) => {
    const prefersDarkTheme = usePrefersDarkTheme()

    const options = useMemo(() => ({
        ...stripeOptions,
        appearance: { theme: prefersDarkTheme ? 'night' : undefined }
    } as const), [prefersDarkTheme, stripeOptions])

    if (stripeOptions == null) {
        return null
    }

    return (
        <Elements options={options} stripe={stripePromise}>
            <PaymentFormInner {...otherProps} />
        </Elements>
    )
})

const PaymentFormInner: FC<Omit<Props, 'stripeOptions'>> = React.memo(({ purchases, discountCode, onCompletePurchase }) => {
    const stripe = useStripe()
    const elements = useElements()

    const confirmPayment = usePromise(async () => {
        if (!stripe || !elements) {
            console.error('Stripe not initialized yet')
            return
        }

        const { error } = await stripe.confirmPayment({
            elements: elements,
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
            await onCompletePurchase?.()
        }
    }, [elements, onCompletePurchase, stripe], { lazy: true })

    return (
        !stripe || !elements
            ? <LoadingDots size={60} color='var(--color-accent-1)' />
            : <form id="payment-form" onSubmit={preventingDefault(confirmPayment.load)} noValidate>
                <Col padding={20} pageLevel>
                    <PaymentElement id="payment-element" options={{ layout: 'tabs' }} />

                    <Spacer size={16} />

                    <PriceBreakdown purchases={purchases} discountCode={discountCode} />

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
