import { test, expect } from '@playwright/test'

test.describe('E2E Test 3: Rubni uvjet - Invalid route handling', () => {
  test('should display 404 for non-existent pages', async ({ page }) => {
    const response = await page.goto('/this-page-does-not-exist-xyz-123')
    
    await page.screenshot({ path: 'test-results/screenshots/08-404-page.png', fullPage: true })
    
    const is404 = response?.status() === 404
    
    expect(is404).toBeTruthy()
    
    console.log('Invalid route test: 404 page displayed correctly')
  })
})
