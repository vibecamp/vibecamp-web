import { expect, test } from '@playwright/test'

import { loginViaLocalStorage, loginViaUI, logoutViaUI, navigateToTab, signUpViaAPI } from '../helpers/test-utils'

test.describe('Account', () => {

    test('account page shows the logged-in user email', async ({ page }) => {
        const { email, jwt } = await signUpViaAPI()
        await loginViaLocalStorage(page, jwt)

        const slide = await navigateToTab(page, 'Account')

        // Wait for account info to load — email is in a disabled input field
        await expect(slide.getByLabel('Email address').first()).toHaveValue(email, { timeout: 15_000 })
    })

    test('change email updates the displayed email', async ({ page }) => {
        const { jwt } = await signUpViaAPI()
        await loginViaLocalStorage(page, jwt)

        const slide = await navigateToTab(page, 'Account')

        // Wait for Change email button
        await expect(slide.getByRole('button', { name: 'Change email' })).toBeVisible({ timeout: 15_000 })

        // Email editor modal should not be open yet
        await expect(page.getByLabel('New email address')).not.toBeVisible()

        // Click change email
        await slide.getByRole('button', { name: 'Change email' }).click()

        // The email editor modal should appear
        const newEmailInput = page.getByLabel('New email address')
        await expect(newEmailInput).toBeVisible({ timeout: 5_000 })

        // Generate a new email
        const timestamp = Date.now()
        const random = Math.random().toString(36).slice(2, 8)
        const newEmail = `test+changed_${timestamp}_${random}@vibecamp-test.example`

        await newEmailInput.fill(newEmail)
        await page.getByRole('button', { name: 'Submit' }).click()

        // Wait for modal to close and new email to appear in the disabled input
        await expect(page.getByLabel('New email address')).not.toBeVisible({ timeout: 10_000 })
        await expect(slide.getByLabel('Email address').first()).toHaveValue(newEmail, { timeout: 15_000 })
    })

    test('change password allows login with new password', async ({ page }) => {
        const { email, jwt } = await signUpViaAPI()
        await loginViaLocalStorage(page, jwt)

        const slide = await navigateToTab(page, 'Account')

        // Wait for Change password button
        await expect(slide.getByRole('button', { name: 'Change password' })).toBeVisible({ timeout: 15_000 })

        // Password editor modal should not be open yet
        await expect(page.getByLabel('New password')).not.toBeVisible()

        const newPassword = 'NewTestPassword456!'

        // Click change password
        await slide.getByRole('button', { name: 'Change password' }).click()

        // The password editor modal should appear
        await expect(page.getByLabel('New password')).toBeVisible({ timeout: 5_000 })

        await page.getByLabel('New password', { exact: true }).fill(newPassword)
        await page.getByLabel('Confirm password').fill(newPassword)
        await page.getByRole('button', { name: 'Submit' }).click()

        // Wait for modal to close
        await expect(page.getByLabel('New password')).not.toBeVisible({ timeout: 10_000 })

        // Login modal should not be visible yet
        await expect(page.getByRole('button', { name: 'Log in' })).not.toBeVisible()

        // Log out
        await logoutViaUI(page)

        // Log back in with the new password
        await loginViaUI(page, email, newPassword)

        // Should be logged in — login modal gone
        await expect(page.getByRole('button', { name: 'Log in' })).not.toBeVisible()
    })

    test('log out makes login modal reappear', async ({ page }) => {
        const { jwt } = await signUpViaAPI()
        await loginViaLocalStorage(page, jwt)

        // Login modal should not be visible when logged in
        await expect(page.getByRole('button', { name: 'Log in' })).not.toBeVisible()

        await logoutViaUI(page)

        // Login modal should be back
        await expect(page.getByRole('button', { name: 'Log in' })).toBeVisible({ timeout: 10_000 })
    })
})
