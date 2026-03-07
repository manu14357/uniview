import { test, expect } from '@playwright/test';

test.describe('DXF Viewer', () => {
  test('loads the demo page', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByText('UniView')).toBeVisible();
  });

  test('shows supported format list including DXF', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByText('DXF')).toBeVisible();
    await expect(page.getByText('DWG')).toBeVisible();
  });
});
