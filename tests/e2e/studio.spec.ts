import { expect, test } from '@playwright/test';

test('opens the studio, advances steps and records completion', async ({ page }) => {
  await page.goto('./');
  await expect(page.getByRole('heading', { name: /把每一段绳路/ })).toBeVisible();
  await page.getByRole('link', { name: '进入 3D 练习室' }).click();
  await expect(page.locator('#course').getByRole('heading', { name: /单柱基础/ })).toBeVisible();
  await page.getByRole('button', { name: '我已了解' }).click();
  await page.getByRole('button', { name: '下一步' }).click();
  await expect(page.getByRole('heading', { name: '建立第一圈并保留间隙' })).toBeVisible();
  await expect(page.locator('.step-panel').getByText('两指检查位置')).toBeVisible();
  await expect(page.getByText('1/4 步')).toBeVisible();
});

test('supports course filtering and the simplified diagram mode', async ({ page }) => {
  await page.goto('./');
  await page.getByPlaceholder('搜索课程、技法或安全主题').fill('绳尾');
  await expect(page.locator('#library').getByRole('heading', { name: '基础绳索操作与绳尾管理' })).toBeVisible();
  await page.getByRole('button', { name: '基础技法' }).click();
  await page.getByPlaceholder('搜索课程、技法或安全主题').fill('');
  await expect(page.locator('#library').getByRole('heading', { name: /单柱基础/ })).toBeVisible();
  await page.getByRole('button', { name: '简化图' }).click();
  await expect(page.getByRole('img', { name: /简化二维绳路图/ })).toBeVisible();
});
