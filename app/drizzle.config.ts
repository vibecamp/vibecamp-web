import { defineConfig } from 'drizzle-kit'

if (!process.env.DATABASE_URL) {
    try {
        process.loadEnvFile('.env')
    } catch {}
}

export default defineConfig({
    dialect: 'postgresql',
    schema: './src/db/schema.ts',
    out: './drizzle',
    dbCredentials: { url: process.env.DATABASE_URL ?? '' },

    introspect: { casing: 'preserve' },
    strict: true,
    verbose: true,
})
