import { defineConfig, devices } from '@playwright/test'
import * as fs from 'fs'
import * as path from 'path'

// Load .env.test
const envTestPath = path.resolve(__dirname, '.env.test')
const envTestContent = fs.readFileSync(envTestPath, 'utf-8')
const envTest: Record<string, string> = {}
for (const line of envTestContent.split('\n')) {
    const trimmed = line.trim()
    if (trimmed && !trimmed.startsWith('#')) {
        const eqIndex = trimmed.indexOf('=')
        if (eqIndex > 0) {
            envTest[trimmed.slice(0, eqIndex)] = trimmed.slice(eqIndex + 1)
        }
    }
}

// Back-end env vars from .env.public (test DB credentials)
const backEndEnvPublicPath = path.resolve(__dirname, '../back-end/.env.public')
const backEndEnvPublicContent = fs.readFileSync(backEndEnvPublicPath, 'utf-8')
const backEndEnv: Record<string, string> = {}
for (const line of backEndEnvPublicContent.split('\n')) {
    const trimmed = line.trim()
    if (trimmed && !trimmed.startsWith('#')) {
        const eqIndex = trimmed.indexOf('=')
        if (eqIndex > 0) {
            backEndEnv[trimmed.slice(0, eqIndex)] = trimmed.slice(eqIndex + 1)
        }
    }
}

const useStripe = !!process.env.TEST_STRIPE

const webServers: Array<{
    command: string
    cwd?: string
    port?: number
    stdout?: string
    reuseExistingServer?: boolean
    env?: Record<string, string>
    timeout?: number
}> = []

// When TEST_STRIPE is set, start stripe listen first so it can capture the
// webhook signing secret before the back-end starts.
if (useStripe) {
    webServers.push({
        command: 'bash tests/helpers/start-stripe-listen.sh',
        stdout: 'Ready!',
        reuseExistingServer: !process.env.CI,
        timeout: 30_000,
    })
}

// Back-end — use wrapper script so it can pick up the Stripe secret file
webServers.push({
    command: useStripe
        ? 'bash tests/helpers/start-backend.sh'
        : 'deno run --allow-net --allow-env --allow-read index.ts',
    cwd: useStripe ? undefined : path.resolve(__dirname, '../back-end'),
    port: 10000,
    reuseExistingServer: !process.env.CI,
    env: {
        ...backEndEnv,
        DISABLE_RATE_LIMIT: '1',
    },
})

// Front-end
webServers.push({
    command: 'npx next dev',
    port: 3000,
    reuseExistingServer: !process.env.CI,
    env: {
        ...envTest,
    },
})

export default defineConfig({
    testDir: './tests/e2e',
    fullyParallel: true,
    forbidOnly: !!process.env.CI,
    retries: process.env.CI ? 2 : 0,
    workers: process.env.CI ? 1 : undefined,
    reporter: 'html',
    timeout: 60_000,

    use: {
        baseURL: 'http://localhost:3000',
        trace: 'on-first-retry',
    },

    projects: [
        {
            name: 'chromium',
            use: { ...devices['Desktop Chrome'] },
        },
    ],

    webServer: webServers,
})
