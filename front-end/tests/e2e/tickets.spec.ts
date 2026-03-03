import { expect, test } from '@playwright/test'

import { loginViaLocalStorage, navigateToTab, signUpViaAPI } from '../helpers/test-utils'

test.describe('Tickets', () => {

    test('Tickets page displays after login', async ({ page }) => {
        const { jwt } = await signUpViaAPI()
        await loginViaLocalStorage(page, jwt)

        // The default view is Tickets
        const slide = await navigateToTab(page, 'Tickets')
        // The nav should show Tickets as active
        await expect(page.locator('.nav a.active')).toContainText('Tickets')
        // Tickets content should have loaded
        await expect(slide.getByRole('heading', { name: 'My tickets' })).toBeVisible({ timeout: 15_000 })
    })

    test('festival listings render', async ({ page }) => {
        const { jwt } = await signUpViaAPI()
        await loginViaLocalStorage(page, jwt)

        const slide = await navigateToTab(page, 'Tickets')

        // At least one festival should load and render
        await expect(slide.getByRole('heading', { level: 2 }).first()).toBeVisible({ timeout: 15_000 })
    })

    // Requires Stripe CLI: brew install stripe/stripe-cli/stripe
    // Run with: TEST_STRIPE=1 npm run test:e2e
    test('Stripe purchase flow', async ({ page }) => {
        test.skip(!process.env.TEST_STRIPE, 'Set TEST_STRIPE=1 to enable (requires Stripe CLI)')
        test.setTimeout(120_000) // Stripe iframes can be slow

        const { jwt } = await signUpViaAPI()
        await loginViaLocalStorage(page, jwt)
        const slide = await navigateToTab(page, 'Tickets')

        // Wait for festivals to load
        await expect(slide.getByRole('heading', { level: 2 }).first()).toBeVisible({ timeout: 15_000 })

        // Purchase modal should not be open yet
        await expect(page.getByLabel('Attendee name')).not.toBeVisible()

        // Find a "Buy tickets" button (festival with sales_are_open)
        const buyButton = slide.getByRole('button', { name: /buy tickets/i }).first()
        await buyButton.click()

        // --- Selection view: fill attendee info (in the purchase modal) ---

        // Attendee form should now be visible
        await expect(page.getByLabel('Attendee name')).toBeVisible({ timeout: 5_000 })

        // Fill attendee name (required)
        await page.getByLabel('Attendee name').fill('Test Attendee')

        // Select an age range (required) — the fieldset has legend "I am..."
        const ageGroup = page.locator('fieldset').filter({ hasText: 'I am...' })
        await ageGroup.locator('input[type="radio"]').first().check()

        // Select a ticket type (required) — the radio group with name="" (empty label)
        await page.locator('fieldset input[type="radio"][name=""]').first().check()

        // Accept terms and conditions
        await page.locator('input[type="checkbox"]').first().check()

        // Scope locators to nested MultiView slides inside the purchase modal
        // (selection=0, payment=1, badges=2)
        const modalSlide = (index: number) => page.locator('.modal .multi-view .slide').nth(index)
        const stripeFrame = page.frameLocator('iframe[name*="__privateStripeFrame"]').first()

        // Proceed to payment
        await page.getByRole('button', { name: 'Proceed to payment' }).click()

        // --- Payment view: fill Stripe card details ---

        // Wait for Stripe PaymentElement iframe to load
        await expect(stripeFrame.locator('[name="number"]')).toBeVisible({ timeout: 30_000 })

        // Fill in Stripe test card details
        await stripeFrame.locator('[name="number"]').fill('4242424242424242')
        await stripeFrame.locator('[name="expiry"]').fill('12/30')
        await stripeFrame.locator('[name="cvc"]').fill('123')
        await stripeFrame.locator('[name="postalCode"]').fill('12345')

        // Submit payment
        await page.getByRole('button', { name: 'Pay now' }).click()

        // Wait for purchase to complete — badges step heading should be visible
        // in the third slide of the purchase modal's nested MultiView
        await expect(modalSlide(2).getByRole('heading', { name: 'Add badge info?' })).toBeVisible({ timeout: 30_000 })
    })
})
