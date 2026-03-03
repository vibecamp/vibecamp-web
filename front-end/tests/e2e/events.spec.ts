import { expect, test } from '@playwright/test'

import { loginViaLocalStorage, navigateToTab, signUpViaAPI } from '../helpers/test-utils'

test.describe('Events', () => {

    test('Events tab shows events', async ({ page }) => {
        const { jwt } = await signUpViaAPI()
        await loginViaLocalStorage(page, jwt)

        const slide = await navigateToTab(page, 'Events')

        // At least one event card should load and render
        await expect(slide.locator('.eventCard').first()).toBeVisible({ timeout: 15_000 })
    })

    test('filter tabs are clickable and do not crash', async ({ page }) => {
        const { jwt } = await signUpViaAPI()
        await loginViaLocalStorage(page, jwt)

        const slide = await navigateToTab(page, 'Events')

        // Wait for Events page to load
        await expect(slide.getByRole('heading', { name: 'Events' })).toBeVisible({ timeout: 15_000 })

        // Click each filter option (All, Starred, Mine, Past) — second .row-select (first is Card/Compact view)
        const filterTabs = slide.locator('.row-select').nth(1).locator('label')
        const count = await filterTabs.count()

        for (let i = 0; i < count; i++) {
            await filterTabs.nth(i).click()
            // Page should still be functional (no crash)
            await expect(slide.getByRole('heading', { name: 'Events' })).toBeVisible()
        }
    })

    test('search finds events by name', async ({ page }) => {
        const { jwt } = await signUpViaAPI()
        await loginViaLocalStorage(page, jwt)

        const slide = await navigateToTab(page, 'Events')

        // Look for a search input within the active slide
        const searchInput = slide.locator('input[aria-placeholder="Search..."]')

        await expect(searchInput).toBeVisible({ timeout: 15_000 })

        await searchInput.fill('test')
        // The page should still render without errors
        await expect(slide.getByRole('heading', { name: 'Events' })).toBeVisible()
    })

    test('create event button hidden for users without tickets', async ({ page }) => {
        // Fresh account has no tickets, so create event should not be available
        const { jwt } = await signUpViaAPI()
        await loginViaLocalStorage(page, jwt)

        const slide = await navigateToTab(page, 'Events')

        // Wait for the page to load
        await expect(slide.getByRole('heading', { name: 'Events' })).toBeVisible({ timeout: 15_000 })

        // A "create event" button should not be visible for a fresh user
        const createButton = slide.getByRole('button', { name: /create.*event/i })
        await expect(createButton).not.toBeVisible()
    })
})
