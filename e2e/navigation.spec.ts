import { test, expect } from '@playwright/test'

test.describe('E2E Test 5: Redovni slučaj - Complete user workflow', () => {
  test('should complete full browse and view workflow', async ({ page }) => {
    await page.goto('/')
    await expect(page.locator('h1')).toContainText('Welcome to PadelTime')
    await page.screenshot({ path: 'test-results/screenshots/10-homepage.png', fullPage: true })
    console.log('Homepage loaded')
    
    await page.goto('/browse-clubs')
    await expect(page.locator('h1')).toContainText('Browse Clubs')
    await page.screenshot({ path: 'test-results/screenshots/11-browse-clubs-workflow.png', fullPage: true })
    
    const clubCount = await page.locator('h3').count()
    expect(clubCount).toBeGreaterThan(0)
    console.log(`Browse clubs: ${clubCount} clubs available`)
    
    await page.locator('button:has-text("View Details")').first().click()
    await page.waitForURL(/\/club\//)
    await page.screenshot({ path: 'test-results/screenshots/12-club-details-workflow.png', fullPage: true })
    
    const clubName = await page.locator('h1').textContent()
    console.log(`Viewing club: ${clubName}`)
    
    await expect(page.locator('text=Information')).toBeVisible()
    
    const backButton = page.locator('a:has-text("Back to Browse")')
    if (await backButton.isVisible()) {
      await backButton.click()
      await expect(page.locator('h1')).toContainText('Browse Clubs')
      await page.screenshot({ path: 'test-results/screenshots/13-back-to-browse.png', fullPage: true })
      console.log('Successfully navigated back to browse clubs')
    }
    
    console.log('Complete user workflow test passed')
  })
})
