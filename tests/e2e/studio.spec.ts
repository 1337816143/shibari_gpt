import { expect, test } from '@playwright/test';

test('opens the studio and advances steps', async ({ page }) => {
  await page.goto('./');
  await expect(page.getByRole('heading', { name: /把每一段绳路/ })).toBeVisible();
  await page.getByRole('link', { name: '进入 3D 练习室' }).click();
  await expect(page.getByRole('heading', { name: /单柱基础/ })).toBeVisible();
  await page.getByRole('button', { name: '我已了解' }).click();
  await page.getByRole('button', { name: '下一步' }).click();
  await expect(page.getByRole('heading', { name: '建立第一圈并保留间隙' })).toBeVisible();
});
