
const BACK_END_ORIGIN = process.env.NEXT_PUBLIC_BACK_END_ORIGIN
if (!BACK_END_ORIGIN) throw Error('Expected environment variable NEXT_PUBLIC_BACK_END_ORIGIN not found')

const STRIPE_PUBLIC_KEY = process.env.NEXT_PUBLIC_STRIPE_PUBLIC_KEY
if (!STRIPE_PUBLIC_KEY) throw Error('Expected environment variable NEXT_PUBLIC_STRIPE_PUBLIC_KEY not found')

export default {
    BACK_END_ORIGIN,
    STRIPE_PUBLIC_KEY,
}