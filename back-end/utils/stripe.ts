import StripeSDK from 'stripe'
import env from '../env.ts'

export const stripe = new StripeSDK(env.STRIPE_SECRET_KEY, {
  apiVersion: '2023-08-16',
})
