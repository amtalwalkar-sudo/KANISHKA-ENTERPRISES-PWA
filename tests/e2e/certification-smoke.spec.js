import { test, expect } from '@playwright/test';

test.describe('KFE 2.0 certification pipeline smoke', () => {
  test('PWA boots and exposes the application mount', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('#app')).toBeVisible();
    await expect(page.locator('#app')).not.toBeEmpty();
  });
});
