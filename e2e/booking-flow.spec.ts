import { test, expect } from '@playwright/test'

test.describe('E2E Test 4: Nepostojeće funkcionalnosti - Invalid court', () => {
  test('should show error for non-existent court', async ({ page }) => {
    await page.goto('/book-court/99999999')
    
    await page.screenshot({ path: 'test-results/screenshots/09-invalid-court-error.png', fullPage: true })
    
    const errorText = page.locator('text=Court not found')
    await expect(errorText).toBeVisible()
    
    console.log('Invalid court ID correctly shows error message')
  })
})
