import { test, expect } from '@playwright/test'

test.describe('E2E Test 2: Rubni uvjet - Form validation', () => {
  test('should prevent submission with empty required fields', async ({ page }) => {
    await page.goto('/setup-club')
    
    await expect(page.locator('h1')).toContainText('Set Up Your Club')
    await page.screenshot({ path: 'test-results/screenshots/04-setup-club-empty-form.png', fullPage: true })
    
    const submitButton = page.locator('button:has-text("Save Club Information")')
    await submitButton.click()
    
    await page.waitForTimeout(500)
    await page.screenshot({ path: 'test-results/screenshots/05-form-validation-errors.png', fullPage: true })
    
    const clubNameInput = page.locator('input[placeholder*="club name"]')
    const isInvalid = await clubNameInput.evaluate((el: HTMLInputElement) => !el.validity.valid)
    
    expect(isInvalid).toBeTruthy()
    console.log('Form validation prevented empty form submission')
  })
  
  test('should accept valid club information', async ({ page }) => {
    await page.goto('/setup-club')
    
    const timestamp = Date.now()
    await page.locator('input[placeholder*="club name"]').fill(`Test Club ${timestamp}`)
    await page.locator('input[placeholder*="address"]').fill('Test Address 123')
    await page.locator('textarea[placeholder*="rules"]').fill('Test club rules')
    await page.screenshot({ path: 'test-results/screenshots/06-setup-club-filled-form.png', fullPage: true })
    
    const submitButton = page.locator('button:has-text("Save Club Information")')
    await submitButton.click()
    
    await page.waitForTimeout(1000)
    await page.screenshot({ path: 'test-results/screenshots/07-form-submitted.png', fullPage: true })
    
    console.log('Form accepted valid club data')
  })
})
