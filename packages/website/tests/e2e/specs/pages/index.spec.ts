import { expect, test } from '@playwright/test';

const mockRelease = {
  tag_name: 'v1.41.1',
  assets: [
    { name: 'rotki-darwin_arm64-v1.41.1.dmg', browser_download_url: 'https://github.com/rotki/rotki/releases/download/v1.41.1/rotki-darwin_arm64-v1.41.1.dmg' },
    { name: 'rotki-darwin_x64-v1.41.1.dmg', browser_download_url: 'https://github.com/rotki/rotki/releases/download/v1.41.1/rotki-darwin_x64-v1.41.1.dmg' },
    { name: 'rotki-linux_x86_64-v1.41.1.AppImage', browser_download_url: 'https://github.com/rotki/rotki/releases/download/v1.41.1/rotki-linux_x86_64-v1.41.1.AppImage' },
    { name: 'rotki-win32_x64-v1.41.1.exe', browser_download_url: 'https://github.com/rotki/rotki/releases/download/v1.41.1/rotki-win32_x64-v1.41.1.exe' },
  ],
};

const mockAvailableTiers = {
  settings: {
    is_authenticated: false,
    country: null,
  },
  tiers: [
    { tier_name: 'Free', monthly_plan: null, yearly_plan: null },
    { tier_name: 'Basic', monthly_plan: { plan_id: 3, price: '25.00' }, yearly_plan: { plan_id: 4, price: '250.00' } },
    { tier_name: 'Advanced', monthly_plan: { plan_id: 1, price: '45.00' }, yearly_plan: { plan_id: 2, price: '450.00' } },
  ],
};

const mockTiersInfo = [
  {
    name: 'Basic',
    monthly_plan: { price: '25.00', id: 3 },
    yearly_plan: { price: '250.00', id: 4 },
    limits: { eth_staked_limit: 128, limit_of_devices: 2, pnl_events_limit: 30000, max_backup_size_mb: 150, history_events_limit: 30000, reports_lookup_limit: 100 },
    description: [
      { label: 'Historical events limit', value: '30K events' },
      { label: 'Encrypted data backups', value: 'Store up to 150MB' },
    ],
  },
  {
    name: 'Advanced',
    monthly_plan: { price: '45.00', id: 1 },
    yearly_plan: { price: '450.00', id: 2 },
    limits: { eth_staked_limit: 384, limit_of_devices: 4, pnl_events_limit: 100000, max_backup_size_mb: 600, history_events_limit: 100000, reports_lookup_limit: 300 },
    description: [
      { label: 'Historical events limit', value: '100K events' },
      { label: 'Encrypted data backups', value: 'Store up to 600MB' },
    ],
  },
];

async function setupTiersMocks(page: import('@playwright/test').Page): Promise<void> {
  await page.route('**/webapi/2/available-tiers', async route => route.fulfill({ json: mockAvailableTiers }));
  await page.route('**/webapi/2/tiers/info', async route => route.fulfill({ json: mockTiersInfo }));
  await page.route('**/webapi/csrf/**', async route => route.fulfill({ json: { detail: 'CSRF cookie set' } }));
}

test.describe('homepage', () => {
  test('successfully loads', async ({ page }) => {
    await setupTiersMocks(page);
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test('checks our homepage hero buttons!', async ({ page }) => {
    await setupTiersMocks(page);
    await page.goto('/', { waitUntil: 'networkidle' });

    await expect(
      page.getByRole('button', { name: 'Download rotki for free' }).first(),
    ).toBeVisible();

    // Wait for the pricing section to load (it's wrapped in ClientOnly)
    await expect(
      page.getByRole('button', { name: 'Start now for free' }).first(),
    ).toBeVisible({ timeout: 30000 });

    await expect(
      page.getByRole('button', { name: 'Get Premium' }).first(),
    ).toBeVisible();
  });
});

test.describe('download page', () => {
  test('download page loads properly', async ({ page }) => {
    await setupTiersMocks(page);
    await page.route('**/api/releases/latest', async route => route.fulfill({ json: mockRelease }));
    await page.goto('/', { waitUntil: 'networkidle' });
    // Scroll to the pricing section first to ensure it's in view
    await page.locator('[data-cy="pricing-section"]').scrollIntoViewIfNeeded();
    // Wait for the pricing section to load (it's wrapped in ClientOnly)
    // Click "See all features" first to expand the pricing section and avoid the gradient overlay
    await page.getByRole('button', { name: 'See all features' }).click({ timeout: 30000 });
    await page.getByRole('button', { name: 'Start now for free' }).first().click({ timeout: 30000 });

    await expect(page).toHaveURL(/.*\/download/);

    await expect(
      page.locator('h6').filter({ hasText: 'Download rotki' }).first(),
    ).toBeVisible();

    await expect(
      page
        .locator('h3')
        .filter({
          hasText:
            'Download now and start using across all major Operating Systems',
        })
        .first(),
    ).toBeVisible();
  });

  test('show links for mac', async ({ browser }) => {
    const context = await browser.newContext({
      userAgent:
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
    });
    const page = await context.newPage();
    await page.route('**/api/releases/latest', async route => route.fulfill({ json: mockRelease }));

    await page.goto('/download', {
      waitUntil: 'networkidle',
    });

    // Mac has two download buttons (Apple Silicon and Intel)
    const appleSiliconButton = page.getByRole('button', { name: 'Download for MAC Apple Silicon' });
    const appleIntelButton = page.getByRole('button', { name: 'Download for MAC Intel' });

    await expect(appleSiliconButton).toBeVisible();
    await expect(appleIntelButton).toBeVisible();

    // Verify href values
    const appleSiliconHref = await appleSiliconButton.locator('..').getAttribute('href');
    const appleIntelHref = await appleIntelButton.locator('..').getAttribute('href');

    expect(appleSiliconHref).toBe('https://github.com/rotki/rotki/releases/download/v1.41.1/rotki-darwin_arm64-v1.41.1.dmg');
    expect(appleIntelHref).toBe('https://github.com/rotki/rotki/releases/download/v1.41.1/rotki-darwin_x64-v1.41.1.dmg');

    await context.close();
  });

  test('show links for linux', async ({ browser }) => {
    const context = await browser.newContext({
      userAgent:
        'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
    });
    const page = await context.newPage();
    await page.route('**/api/releases/latest', async route => route.fulfill({ json: mockRelease }));

    await page.goto('/download', {
      waitUntil: 'networkidle',
    });

    const linuxButton = page.locator('[data-cy="main-download-button"]').filter({ hasText: 'Download for LINUX' });
    await expect(linuxButton).toBeVisible();

    // Verify href value
    const linuxHref = await linuxButton.locator('..').getAttribute('href');
    expect(linuxHref).toBe('https://github.com/rotki/rotki/releases/download/v1.41.1/rotki-linux_x86_64-v1.41.1.AppImage');

    await context.close();
  });

  test('show links for windows', async ({ browser }) => {
    const context = await browser.newContext({
      userAgent:
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
    });
    const page = await context.newPage();
    await page.route('**/api/releases/latest', async route => route.fulfill({ json: mockRelease }));

    await page.goto('/download', {
      waitUntil: 'networkidle',
    });

    const windowsButton = page.locator('[data-cy="main-download-button"]').filter({ hasText: 'Download for WINDOWS' });
    await expect(windowsButton).toBeVisible();

    // Verify href value
    const windowsHref = await windowsButton.locator('..').getAttribute('href');
    expect(windowsHref).toBe('https://github.com/rotki/rotki/releases/download/v1.41.1/rotki-win32_x64-v1.41.1.exe');

    await context.close();
  });

  test('checks all download links!', async ({ page }) => {
    await page.route('**/api/releases/latest', async route => route.fulfill({ json: mockRelease }));
    await page.goto('/download', {
      waitUntil: 'networkidle',
    });

    await page.locator('[data-cy="show-all-download"]').click();

    const linuxLink = page.locator('h6').filter({ hasText: 'LINUX' }).first();
    const appleLink = page.locator('h6').filter({ hasText: 'MAC' }).first();
    const windowsLink = page.locator('h6').filter({ hasText: 'WINDOWS' }).first();

    await expect(linuxLink).toBeVisible();
    await expect(appleLink).toBeVisible();
    await expect(windowsLink).toBeVisible();
    await expect(page.locator('p').filter({ hasText: 'Latest Release: v' }).first()).toBeVisible();

    // Linux download button
    const linuxButton = linuxLink
      .locator('..')
      .locator('..')
      .locator('div button')
      .filter({ hasText: 'Download' });

    await expect(linuxButton).toBeVisible();
    await expect(linuxButton).toBeEnabled();

    const linuxHref = await linuxButton.locator('..').getAttribute('href');
    expect(linuxHref).toContain('rotki-linux');
    expect(linuxHref).toContain('.AppImage');

    // Windows download button
    const windowsButton = windowsLink
      .locator('..')
      .locator('..')
      .locator('div button')
      .filter({ hasText: 'Download' });

    await expect(windowsButton).toBeVisible();
    await expect(windowsButton).toBeEnabled();

    const windowsHref = await windowsButton.locator('..').getAttribute('href');
    expect(windowsHref).toContain('rotki-win32');
    expect(windowsHref).toContain('.exe');

    // Apple download button (opens menu)
    const appleButton = appleLink
      .locator('..')
      .locator('..')
      .locator('div button')
      .filter({ hasText: 'Download' });

    await expect(appleButton).toBeVisible();
    await appleButton.click();

    const appleMenu = page.locator('[role=menu-content]');
    await expect(appleMenu).toBeVisible();

    const appleSiliconLink = page.getByRole('link', { name: 'MAC Apple Silicon' });
    const appleIntelLink = page.getByRole('link', { name: 'MAC Intel' });

    const appleSiliconHref = await appleSiliconLink.getAttribute('href');
    expect(appleSiliconHref).toContain('rotki-darwin_arm');
    expect(appleSiliconHref).toContain('.dmg');

    const appleIntelHref = await appleIntelLink.getAttribute('href');
    expect(appleIntelHref).toContain('rotki-darwin_x');
    expect(appleIntelHref).toContain('.dmg');

    // Docker section
    const dockerLink = page.locator('h6').filter({ hasText: 'DOCKER' }).first();
    await expect(dockerLink).toBeVisible();

    const dockerInput = dockerLink.locator('..').locator('input');
    await expect(dockerInput).toBeVisible();
    await expect(dockerInput).toHaveValue('docker pull rotki/rotki');
  });
});
