import { expect, test } from '@playwright/test'

import { TEST_PASSWORD, generateTestEmail, getPasswordResetSecret, loginViaLocalStorage, logoutViaUI, navigateToTab, signUpViaAPI } from '../helpers/test-utils'

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
        // test.skip(!process.env.TEST_STRIPE, 'Set TEST_STRIPE=1 to enable (requires Stripe CLI)')
        test.setTimeout(120_000) // Stripe iframes can be slow

        const { jwt } = await signUpViaAPI()
        await loginViaLocalStorage(page, jwt)
        const slide = await navigateToTab(page, 'Tickets')

        // Wait for festivals to load
        await expect(slide.getByRole('heading', { level: 2 }).first()).toBeVisible({ timeout: 15_000 })

        // Purchase modal should not be open yet
        await expect(slide.getByLabel('Attendee name')).not.toBeVisible()

        // Find a "Buy tickets" button (festival with sales_are_open)
        const buyButton = slide.getByRole('button', { name: /buy tickets/i }).first()
        await buyButton.click()

        // --- Selection view: fill attendee info (in the purchase modal) ---

        // Attendee form should now be visible
        await expect(slide.getByLabel('Attendee name')).toBeVisible({ timeout: 5_000 })

        // Fill attendee name (required)
        await slide.getByLabel('Attendee name').clear()
        await slide.getByLabel('Attendee name').fill('Test Attendee')

        // Select an age range (required) — the fieldset has legend "I am..."
        const ageGroup = slide.locator('fieldset').filter({ hasText: 'I am...' })
        await ageGroup.locator('input[type="radio"]').first().check()

        // Select a ticket type (required) — the radio group with name="" (empty label)
        await slide.locator('fieldset input[type="radio"][name=""]').first().check()

        // Accept terms and conditions
        await slide.locator('input[type="checkbox"]').first().check()

        // Scope locators to nested MultiView slides inside the purchase modal
        // (selection=0, payment=1, badges=2)
        const modalSlide = (index: number) => slide.locator('.modal .multi-view .slide').nth(index)
        const stripeFrame = slide.frameLocator('iframe[name*="__privateStripeFrame"]').first()

        // Proceed to payment
        await slide.getByRole('button', { name: 'Proceed to payment' }).click()

        // --- Payment view: fill Stripe card details ---

        // Wait for Stripe PaymentElement iframe to load
        await expect(stripeFrame.locator('[name="number"]')).toBeVisible({ timeout: 30_000 })

        // Fill in Stripe test card details
        await stripeFrame.locator('[name="number"]').fill('4242424242424242')
        await stripeFrame.locator('[name="expiry"]').fill('12/30')
        await stripeFrame.locator('[name="cvc"]').fill('123')
        await stripeFrame.locator('[name="postalCode"]').fill('12345')

        // Submit payment
        await slide.getByRole('button', { name: 'Pay now' }).click()

        // Wait for purchase to complete — badges step heading should be visible
        // in the third slide of the purchase modal's nested MultiView
        await expect(modalSlide(2).getByRole('heading', { name: 'Add badge info?' })).toBeVisible({ timeout: 30_000 })
    })

    // Requires Stripe CLI (same as the self-purchase test). End-to-end gift
    // flow: gifter buys a ticket for a fresh recipient email, then we log out,
    // pretend the recipient clicked the "set up your account" link in their
    // email (using a test-only back-end hook to retrieve the reset secret),
    // sign in as the recipient, fill out the attendee + badge prompts, and
    // confirm the ticket shows up under their account.
    test('Stripe gift purchase flow', async ({ page }) => {
        test.setTimeout(180_000)

        // --- 1. Gifter signs in and opens the gift modal ---

        const { jwt: gifterJwt } = await signUpViaAPI()
        await loginViaLocalStorage(page, gifterJwt)
        const slide = await navigateToTab(page, 'Tickets')

        await expect(slide.getByRole('heading', { level: 2 }).first()).toBeVisible({ timeout: 15_000 })

        const recipientEmail = generateTestEmail()

        await slide.getByRole('button', { name: 'Send a gift' }).first().click()

        // Recipient email field shows up in the gift modal
        await expect(slide.getByLabel('Recipient email address')).toBeVisible({ timeout: 5_000 })
        await slide.getByLabel('Recipient email address').fill(recipientEmail)

        // --- 2. Pick a ticket: bump the first attendance-ticket NumberInput to 1 ---

        const ticketsHeading = slide.getByRole('heading', { name: 'Tickets', exact: true })
        await expect(ticketsHeading).toBeVisible()
        // The PurchaseTypeRow rows live as siblings of the heading. Each row
        // contains a description div followed by a NumberInput. Grabbing the
        // first row's number input gives us the first available ticket type.
        const firstTicketRow = slide.locator('.modal').locator('input[type="number"]').first()
        await firstTicketRow.fill('1')

        // Accept terms
        await slide.locator('.modal input[type="checkbox"]').first().check()

        const stripeFrame = slide.frameLocator('iframe[name*="__privateStripeFrame"]').first()
        await slide.getByRole('button', { name: 'Proceed to payment' }).click()

        // --- 3. Stripe payment ---

        await expect(stripeFrame.locator('[name="number"]')).toBeVisible({ timeout: 30_000 })
        await stripeFrame.locator('[name="number"]').fill('4242424242424242')
        await stripeFrame.locator('[name="expiry"]').fill('12/30')
        await stripeFrame.locator('[name="cvc"]').fill('123')
        await stripeFrame.locator('[name="postalCode"]').fill('12345')

        await slide.getByRole('button', { name: 'Pay now' }).click()

        // After successful payment, the gift-sent view should appear
        await expect(slide.getByRole('heading', { name: 'Your gift has been sent!' })).toBeVisible({ timeout: 30_000 })
        await slide.getByRole('button', { name: 'Close' }).click()

        // --- 4. Log out as gifter ---

        await logoutViaUI(page)

        // --- 5. Fetch the recipient's password-reset secret via the test-only
        // back-end hook, then visit the URL the link in their email would
        // have pointed at ---

        const secret = await getPasswordResetSecret(recipientEmail)
        const resetHash = encodeURIComponent(JSON.stringify({ passwordResetSecret: secret }))
        await page.goto(`/#${resetHash}`)

        // The login modal should switch into "new-password" mode automatically
        await expect(page.getByLabel('New password', { exact: true })).toBeVisible({ timeout: 10_000 })
        await page.getByLabel('New password', { exact: true }).fill(TEST_PASSWORD)
        await page.getByLabel('Confirm new password').fill(TEST_PASSWORD)
        await page.getByRole('button', { name: 'Update password' }).click()

        // Login modal should close
        await expect(page.locator('.modal.open')).toHaveCount(1, { timeout: 15_000 }) // attendee prompt is now open

        // --- 6. Recipient fills out the "Tell us about you" attendee modal ---

        const attendeeModal = page.locator('.modal.open')
        await expect(attendeeModal.getByLabel('Attendee name')).toBeVisible({ timeout: 10_000 })
        await attendeeModal.getByLabel('Attendee name').fill('Gift Recipient')
        await attendeeModal.getByLabel('21 or over').check()
        await attendeeModal.getByRole('button', { name: 'Save' }).click()

        // --- 7. The badge prompt should follow ---

        // The badge form's first input is labeled "Name" (BadgeInfoForm.tsx).
        // The attendee form uses "Attendee name", so the appearance of "Name"
        // is our signal that we've transitioned to the badge prompt.
        const badgeModal = page.locator('.modal.open')
        await expect(badgeModal.getByLabel('Name', { exact: true })).toBeVisible({ timeout: 15_000 })
        await badgeModal.getByLabel('Name', { exact: true }).fill('Recipient Badge')
        await badgeModal.getByRole('button', { name: 'Save' }).click()

        // All required-info modals should now be closed
        await expect(page.locator('.modal.open')).toHaveCount(0, { timeout: 15_000 })

        // --- 8. Confirm the ticket shows up on the recipient's Tickets tab ---

        const recipientTicketsSlide = await navigateToTab(page, 'Tickets')
        await expect(recipientTicketsSlide.getByRole('heading', { name: 'My tickets' })).toBeVisible({ timeout: 10_000 })
        // The empty-state placeholder text should not appear for a festival
        // we have a ticket for. (If it did, the ticket didn't end up under
        // this account.)
        await expect(recipientTicketsSlide.getByText('after you purchase tickets')).not.toBeVisible()
    })
})
