import { z } from 'zod'

const schema = z.object({
    DATABASE_URL: z.url(),
    JWT_SECRET: z.string().min(1),
    STRIPE_SECRET_KEY: z.string().startsWith('sk_'),
    STRIPE_WEBHOOK_SECRET: z.string().startsWith('whsec_'),

    MAILGUN_API_KEY: z
        .string()
        .optional()
        .transform((v) => (v ? v : undefined)),
    MAILGUN_DOMAIN: z.string().default('mail.vibe.camp'),
    APP_BASE_URL: z.url(),
    AV_NEEDS_EMAIL: z.email(),

    TZ: z.literal('UTC'),
})

export const env = schema.parse(process.env)

if (new Date().getTimezoneOffset() !== 0) {
    throw new Error('Process time zone must be UTC (set TZ=UTC before starting)')
}

export const usingStripeTestKey = env.STRIPE_SECRET_KEY.startsWith('sk_test_')
