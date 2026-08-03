import { expect, test } from '@playwright/test';

const isThreeDimensionalAsset = (url: string) =>
  /\/assets\/(?:StudioScene|react-three|three-core|three-stdlib|GlbAssetModel)-/.test(url);

test('does not download the 3D engine before safety acknowledgement', async ({ page }) => {
  const requestedThreeDimensionalAssets: string[] = [];
  page.on('request', (request) => {
    if (isThreeDimensionalAsset(request.url())) requestedThreeDimensionalAssets.push(request.url());
  });

  await page.goto('./');
  await expect(page.getByRole('heading', { name: /把每一段绳路/ })).toBeVisible();
  expect(requestedThreeDimensionalAssets).toEqual([]);

  await page.getByRole('link', { name: '进入 3D 练习室' }).click();
  await expect(page.getByRole('button', { name: '我已了解' })).toBeVisible();
  await page.waitForTimeout(250);
  expect(requestedThreeDimensionalAssets).toEqual([]);

  await page.getByRole('button', { name: '我已了解' }).click();
  await expect(page.locator('canvas')).toBeVisible({ timeout: 30_000 });
  await expect.poll(() => requestedThreeDimensionalAssets.length).toBeGreaterThan(0);
});

test('opens the studio, advances steps and records completion', async ({ page }) => {
  await page.goto('./');
  await expect(page.getByRole('heading', { name: /把每一段绳路/ })).toBeVisible();
  await page.getByRole('link', { name: '进入 3D 练习室' }).click();
  await expect(page.locator('#course').getByRole('heading', { name: /单柱基础/ })).toBeVisible();
  await page.getByRole('button', { name: '我已了解' }).click();
  await expect(page.locator('canvas')).toBeVisible({ timeout: 30_000 });

  const nextButton = page.getByRole('button', { name: '下一步' });
  await nextButton.scrollIntoViewIfNeeded();
  await expect(nextButton).toBeEnabled();
  await expect(nextButton).toBeInViewport();
  await nextButton.click();

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

test('loads the committed GLB only after integrity verification', async ({ page }) => {
  await page.goto('./');
  await page.getByRole('button', { name: /加载技术 QA 模型/ }).click();
  await expect(page.getByText('Khronos RiggedFigure · 技术 QA')).toBeVisible();

  await page.getByRole('link', { name: '进入 3D 练习室' }).click();
  await page.getByRole('button', { name: '我已了解' }).click();

  const diagnostics = page.locator('.model-diagnostics');
  await expect(diagnostics).toBeVisible({ timeout: 30_000 });
  await diagnostics.locator('summary').click();
  await expect(diagnostics.getByText('蒙皮网格')).toBeVisible();
  await expect(diagnostics.getByText('骨骼')).toBeVisible();
  await expect(page.getByText(/已使用安全占位模型/)).toHaveCount(0);
});
