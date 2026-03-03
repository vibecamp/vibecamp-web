import { type Locator, type Page, expect } from '@playwright/test'

export const TEST_PASSWORD = 'TestPassword123!'

const API_BASE = 'http://localhost:10000/api/v1'

export function generateTestEmail(): string {
    const timestamp = Date.now()
    const random = Math.random().toString(36).slice(2, 8)
    return `test+${timestamp}_${random}@vibecamp-test.example`
}

/**
 * Sign up a new user via the UI login modal.
 * Returns the email used.
 */
export async function signUpViaUI(page: Page): Promise<string> {
    const email = generateTestEmail()

    // Switch to signup mode
    await page.getByRole('button', { name: 'Create an account' }).click()

    // Fill the form
    await page.getByLabel('Email address').fill(email)
    await page.getByLabel('New password', { exact: true }).fill(TEST_PASSWORD)
    await page.getByLabel('Confirm password').fill(TEST_PASSWORD)

    // Login modal should still be open
    await expect(page.locator('.modal.open')).toBeVisible()

    // Submit
    await page.getByRole('button', { name: 'Sign up' }).click()

    // Wait for the login modal to close
    await expect(page.locator('.modal.open')).not.toBeVisible({ timeout: 15_000 })

    return email
}

/**
 * Log in via the UI login modal.
 */
export async function loginViaUI(page: Page, email: string, password: string = TEST_PASSWORD): Promise<void> {
    await page.getByLabel('Email address').fill(email)
    await page.getByLabel('Password').fill(password)
    await page.getByRole('button', { name: 'Log in' }).click()

    // Wait for modal to close
    await expect(page.locator('.modal.open')).not.toBeVisible({ timeout: 15_000 })
}

/**
 * Log out via the Account tab.
 */
export async function logoutViaUI(page: Page): Promise<void> {
    const slide = await navigateToTab(page, 'Account')

    // Login modal should not be visible while logged in
    await expect(page.getByRole('button', { name: 'Log in' })).not.toBeVisible()

    // Wait for account page to load
    await expect(slide.getByRole('button', { name: 'Log out' })).toBeVisible({ timeout: 10_000 })
    await slide.getByRole('button', { name: 'Log out' }).click()

    // Wait for login modal to reappear
    await expect(page.getByRole('button', { name: 'Log in' })).toBeVisible({ timeout: 10_000 })
}

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

/**
 * Sign up a user via the API directly (faster than UI for non-auth tests).
 * Retries on 429 (rate limit) with exponential backoff.
 * Returns { email, jwt }.
 */
export async function signUpViaAPI(): Promise<{ email: string; jwt: string }> {
    const email = generateTestEmail()
    const maxRetries = 5

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
        let res: Response
        try {
            res = await fetch(`${API_BASE}/signup`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email_address: email,
                    password: TEST_PASSWORD,
                }),
            })
        } catch {
            // Network error (connection refused, etc.) — retry
            if (attempt < maxRetries) {
                await sleep(600 * (attempt + 1))
                continue
            }
            throw new Error('API signup failed: network error after max retries')
        }

        if (res.status === 429) {
            if (attempt < maxRetries) {
                await sleep(600 * (attempt + 1))
                continue
            }
            throw new Error('API signup rate limited after max retries')
        }

        const body = await res.json()
        if (!body?.jwt) {
            throw new Error(`API signup failed: ${res.status} ${JSON.stringify(body)}`)
        }

        return { email, jwt: body.jwt }
    }

    throw new Error('API signup failed: exhausted retries')
}

/**
 * Inject a JWT into localStorage and navigate to the app.
 * Fastest way to authenticate for non-auth tests.
 */
export async function loginViaLocalStorage(page: Page, jwt: string): Promise<void> {
    // Set localStorage before navigating
    await page.addInitScript((token: string) => {
        localStorage.setItem('jwt', JSON.stringify(token))
    }, jwt)

    await page.goto('/')

    // Wait for the app to load with the user logged in (modal should not appear)
    await expect(page.getByRole('button', { name: 'Log in' })).not.toBeVisible({ timeout: 15_000 })
}

const TAB_INDEX: Record<string, number> = { Tickets: 0, Events: 1, Account: 2 }

/**
 * Navigate to a tab by clicking the nav link.
 * Returns a locator scoped to the active slide (MultiView renders all tabs
 * simultaneously, so unscoped locators can match off-screen elements).
 */
export async function navigateToTab(page: Page, tabName: string): Promise<Locator> {
    await page.locator('.nav').getByText(tabName, { exact: true }).click()
    return activeSlide(page, tabName)
}

/**
 * Get a locator scoped to the slide for the given tab.
 */
export function activeSlide(page: Page, tabName: string): Locator {
    const index = TAB_INDEX[tabName]
    if (index == null) throw new Error(`Unknown tab: ${tabName}`)
    return page.locator('.slide').nth(index)
}
