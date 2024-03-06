import { Elements,PaymentElement, useElements, useStripe } from '@stripe/react-stripe-js'
import { loadStripe,StripeElementsOptions } from '@stripe/stripe-js'
import React, { FC } from 'react'

import { Purchases } from '../../../../back-end/types/route-types'
import env from '../../env'
import { useObservableClass, useValuesObservable } from '../../mobx/hooks'
import { observer } from '../../mobx/misc'
import { request } from '../../mobx/request'
import { fieldProps,preventingDefault } from '../../utils'
import PriceBreakdown from '../tickets/PriceBreakdown'
import Button from './Button'
import Col from './Col'
import ErrorMessage from './ErrorMessage'
import Input from './Input'
import LoadingDots from './LoadingDots'
import Spacer from './Spacer'

const stripePromise = loadStripe(env.STRIPE_PUBLIC_KEY)

type Props = {
    stripeOptions: StripeElementsOptions | undefined,
    purchases?: Purchases,
    onPrePurchase?: () => Promise<void> | void,
    onCompletePurchase?: () => Promise<void> | void,
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

const PaymentFormInner: FC<Omit<Props, 'stripeOptions'>> = observer(props => {
    const stripeStuff = useValuesObservable({
        stripe: useStripe(),
        elements: useElements()
    })

    const state = useObservableClass(class {
        discountCode = ''

        readonly confirmPayment = request(async () => {
            if (!stripeStuff.stripe || !stripeStuff.elements) {
                console.error('Stripe not initialized yet')
                return
            }

            await props.onPrePurchase?.()

            const { error } = await stripeStuff.stripe.confirmPayment({
                elements: stripeStuff.elements,
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
                await props.onCompletePurchase?.()
            }
        }, { lazy: true })
    })

    return (
        !stripeStuff.stripe || !stripeStuff.elements
            ? <LoadingDots size={60} color='var(--color-accent-1)' />
            : <form id="payment-form" onSubmit={preventingDefault(state.confirmPayment.load)} noValidate>
                <Col padding={20} pageLevel>
                    <PaymentElement id="payment-element" options={{ layout: 'tabs' }} />

                    {props.purchases &&
                        <>
                            <Spacer size={16} />

                            <PriceBreakdown purchases={props.purchases} />
                        </>}

                    <Spacer size={16} />

                    <Input
                        label='Discount code (optional)'
                        {...fieldProps(state, 'discountCode')}
                    />

                    <Spacer size={16} />

                    <ErrorMessage error={state.confirmPayment.state.result} />

                    <Spacer size={8} />

                    <Button isSubmit isPrimary isLoading={state.confirmPayment.state.kind === 'loading'}>
                        Pay now
                    </Button>
                </Col>
            </form>
    )
})
