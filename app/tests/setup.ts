const defaults: Record<string, string> = {
    DATABASE_URL: 'postgresql://postgres:postgres@localhost:5432/vibecamp',
    JWT_SECRET: 'local-dev-only-secret',
    STRIPE_SECRET_KEY: 'sk_test_unit_tests',
    STRIPE_WEBHOOK_SECRET: 'whsec_unit_tests',
    MAILGUN_DOMAIN: 'mail.vibe.camp',
    APP_BASE_URL: 'http://localhost:3000',
    AV_NEEDS_EMAIL: 'av-needs@example.com',
    TZ: 'UTC',
}
for (const [key, value] of Object.entries(defaults)) {
    process.env[key] ??= value
}
