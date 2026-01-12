import { test, expect } from '@playwright/test'

test.describe('E2E Test 1: Redovni slučaj - Browse and search clubs', () => {
  test('should browse clubs, search, and view club details', async ({ page }) => {
    await page.goto('/browse-clubs')
    
    await expect(page.locator('h1')).toContainText('Browse Clubs')
    await page.screenshot({ path: 'test-results/screenshots/01-browse-clubs-page.png', fullPage: true })
    
    const clubHeadings = page.locator('h3')
    const clubCount = await clubHeadings.count()
    expect(clubCount).toBeGreaterThan(0)
    
    const firstClubName = await clubHeadings.first().textContent()
    console.log(`Found ${clubCount} clubs, first club: ${firstClubName}`)
    
    const searchInput = page.locator('input[placeholder*="Search"]')
    await searchInput.fill(firstClubName || 'klub')
    await page.waitForTimeout(300)
    await page.screenshot({ path: 'test-results/screenshots/02-search-filtered.png', fullPage: true })
    
    const filteredClubs = await page.locator('h3').count()
    expect(filteredClubs).toBeGreaterThanOrEqual(1)
    console.log(`Search filtered to ${filteredClubs} clubs`)
    
    const viewDetailsButton = page.locator('button:has-text("View Details")').first()
    await viewDetailsButton.click()
    
    await page.waitForURL(/\/club\//)
    
    await expect(page.locator('h1')).toBeVisible()
    await page.screenshot({ path: 'test-results/screenshots/03-club-details-page.png', fullPage: true })
    const clubPageTitle = await page.locator('h1').textContent()
    console.log(`Navigated to club page: ${clubPageTitle}`)
  })
})
