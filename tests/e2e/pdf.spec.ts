import { test, expect } from '@playwright/test';

test.describe('PDF Viewer', () => {
  test('loads the demo page', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByText('UniView')).toBeVisible();
  });

  test('shows file format badges', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByText('PDF')).toBeVisible();
    await expect(page.getByText('DXF')).toBeVisible();
    await expect(page.getByText('DOCX')).toBeVisible();
  });
});
