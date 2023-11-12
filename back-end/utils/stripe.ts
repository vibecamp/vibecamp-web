import StripeSDK from 'stripe'
import env from '../env.ts'

export const stripe = new StripeSDK(env.STRIPE_SECRET_KEY, {
  // @ts-ignore Use account-default API version
  apiVersion: null,
})
