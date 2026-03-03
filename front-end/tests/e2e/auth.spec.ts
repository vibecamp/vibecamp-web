import { expect, test } from '@playwright/test'

import { TEST_PASSWORD, generateTestEmail, loginViaUI, logoutViaUI, signUpViaAPI, signUpViaUI } from '../helpers/test-utils'

test.describe('Authentication', () => {

    test('login modal is visible on initial load', async ({ page }) => {
        await page.goto('/')
        await expect(page.getByRole('button', { name: 'Log in' })).toBeVisible({ timeout: 15_000 })
    })

    test('sign up a new user closes modal and shows Tickets page', async ({ page }) => {
        await page.goto('/')
        await expect(page.getByRole('button', { name: 'Log in' })).toBeVisible({ timeout: 15_000 })

        // Login modal should be open
        await expect(page.locator('.modal.open')).toBeVisible()

        await signUpViaUI(page)

        // Login modal should be closed
        await expect(page.locator('.modal.open')).not.toBeVisible()
    })

    test('log out and log back in with same credentials', async ({ page }) => {
        await page.goto('/')
        await expect(page.getByRole('button', { name: 'Log in' })).toBeVisible({ timeout: 15_000 })

        const email = await signUpViaUI(page)

        // Login modal should not be visible after signup
        await expect(page.getByRole('button', { name: 'Log in' })).not.toBeVisible()

        await logoutViaUI(page)

        // Login modal should be showing again
        await expect(page.getByRole('button', { name: 'Log in' })).toBeVisible({ timeout: 10_000 })

        await loginViaUI(page, email)

        // Should be logged in again — login modal gone
        await expect(page.getByRole('button', { name: 'Log in' })).not.toBeVisible()
    })

    test('incorrect password shows error', async ({ page }) => {
        // Create a real user first so we get a 401, not a different error
        const { email } = await signUpViaAPI()

        await page.goto('/')
        await expect(page.getByRole('button', { name: 'Log in' })).toBeVisible({ timeout: 15_000 })

        // Error should not be visible before submitting
        await expect(page.getByText('Incorrect email or password')).not.toBeVisible()

        await page.getByLabel('Email address').fill(email)
        await page.getByLabel('Password').fill('WrongPassword123!')
        await page.getByRole('button', { name: 'Log in' }).click()

        await expect(page.getByText('Incorrect email or password')).toBeVisible({ timeout: 15_000 })
    })

    test('toggle between login and signup modes', async ({ page }) => {
        await page.goto('/')
        await expect(page.getByRole('button', { name: 'Log in' })).toBeVisible({ timeout: 15_000 })

        // Default is login mode — signup fields should not be visible
        await expect(page.getByLabel('Password')).toBeVisible()
        await expect(page.getByLabel('Confirm password')).not.toBeVisible()

        // Switch to signup
        await page.getByRole('button', { name: 'Create an account' }).click()
        await expect(page.getByLabel('New password', { exact: true })).toBeVisible()
        await expect(page.getByLabel('Confirm password')).toBeVisible()
        await expect(page.getByRole('button', { name: 'Sign up' })).toBeVisible()

        // Switch back to login — signup fields should disappear
        await page.getByRole('button', { name: 'I already have an account' }).click()
        await expect(page.getByLabel('Confirm password')).not.toBeVisible()
        await expect(page.getByLabel('Password')).toBeVisible()
        await expect(page.getByRole('button', { name: 'Log in' })).toBeVisible()
    })

    test('forgot password mode shows correct UI', async ({ page }) => {
        await page.goto('/')
        await expect(page.getByRole('button', { name: 'Log in' })).toBeVisible({ timeout: 15_000 })

        // Reset password button should not be visible in login mode
        await expect(page.getByRole('button', { name: 'Reset password' })).not.toBeVisible()

        await page.getByRole('button', { name: 'Forgot your password?' }).click()

        // Email field should be visible, password should not
        await expect(page.getByLabel('Email address')).toBeVisible()
        await expect(page.getByLabel('Password')).not.toBeVisible()
        await expect(page.getByRole('button', { name: 'Reset password' })).toBeVisible()

        // Can go back to login
        await page.getByRole('button', { name: 'Back to login' }).click()
        await expect(page.getByRole('button', { name: 'Reset password' })).not.toBeVisible()
        await expect(page.getByRole('button', { name: 'Log in' })).toBeVisible()
    })

    test('email validation on signup shows error', async ({ page }) => {
        await page.goto('/')
        await expect(page.getByRole('button', { name: 'Log in' })).toBeVisible({ timeout: 15_000 })

        // Switch to signup
        await page.getByRole('button', { name: 'Create an account' }).click()

        // Error should not be visible before submitting
        await expect(page.getByText('Please enter a valid email address')).not.toBeVisible()

        // Fill in a bad email
        await page.getByLabel('Email address').fill('not-an-email')
        await page.getByLabel('New password', { exact: true }).fill(TEST_PASSWORD)
        await page.getByLabel('Confirm password').fill(TEST_PASSWORD)
        await page.getByRole('button', { name: 'Sign up' }).click()

        // Should show email validation error
        await expect(page.getByText('Please enter a valid email address')).toBeVisible({ timeout: 5_000 })
    })

    test('password confirmation mismatch shows error', async ({ page }) => {
        await page.goto('/')
        await expect(page.getByRole('button', { name: 'Log in' })).toBeVisible({ timeout: 15_000 })

        // Switch to signup
        await page.getByRole('button', { name: 'Create an account' }).click()

        // Error should not be visible before submitting
        await expect(page.getByText("Passwords don't match")).not.toBeVisible()

        await page.getByLabel('Email address').fill(generateTestEmail())
        await page.getByLabel('New password', { exact: true }).fill(TEST_PASSWORD)
        await page.getByLabel('Confirm password').fill('DifferentPassword123!')
        await page.getByRole('button', { name: 'Sign up' }).click()

        await expect(page.getByText("Passwords don't match")).toBeVisible({ timeout: 5_000 })
    })
})
