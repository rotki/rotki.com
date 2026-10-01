import { expect, type Locator, type Page } from '@playwright/test';
import { test } from '../../support/test';

const mockRelease = {
  tag_name: 'v1.41.1',
  assets: [
    { name: 'rotki-darwin_arm64-v1.41.1.dmg', browser_download_url: 'https://github.com/rotki/rotki/releases/download/v1.41.1/rotki-darwin_arm64-v1.41.1.dmg' },
    { name: 'rotki-darwin_x64-v1.41.1.dmg', browser_download_url: 'https://github.com/rotki/rotki/releases/download/v1.41.1/rotki-darwin_x64-v1.41.1.dmg' },
    { name: 'rotki-linux_x86_64-v1.41.1.AppImage', browser_download_url: 'https://github.com/rotki/rotki/releases/download/v1.41.1/rotki-linux_x86_64-v1.41.1.AppImage' },
    { name: 'rotki-linux_amd64-v1.41.1.deb', browser_download_url: 'https://github.com/rotki/rotki/releases/download/v1.41.1/rotki-linux_amd64-v1.41.1.deb' },
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

/**
 * Opens the list of downloads for other platforms and waits until `entry` in it can be clicked.
 *
 * @remarks
 * The list is rendered collapsed, so its entries already count as visible while its container still
 * covers them. On a cold dev server, as in CI, the first click can land before the page has hydrated
 * and do nothing, so the click repeats (it only ever opens the list) until `entry` receives clicks.
 */
async function showAllDownloads(page: Page, entry: Locator): Promise<void> {
  await expect(async () => {
    await page.locator('[data-cy="show-all-download"]').click();
    await entry.click({ timeout: 1_000, trial: true });
  }).toPass({ timeout: 30_000 });
}

test.describe('homepage', () => {
  test('successfully loads', async ({ page }) => {
    await setupTiersMocks(page);
    await page.goto('/');
    await expect(page.getByRole('button', { name: 'Download rotki for free' }).first()).toBeVisible();
  });

  test('checks our homepage hero buttons!', async ({ page }) => {
    await setupTiersMocks(page);
    await page.goto('/');

    await expect(
      page.getByRole('button', { name: 'Download rotki for free' }).first(),
    ).toBeVisible();

    // Wait for the pricing section to load (it's wrapped in ClientOnly)
    await expect(
      page.getByRole('button', { name: 'Start now for free' }).first(),
    ).toBeVisible({ timeout: 30000 });

    await expect(
      page.getByRole('button', { name: 'Compare plans' }).first(),
    ).toBeVisible();
  });
});

test.describe('download page', () => {
  test('download page loads properly', async ({ page }) => {
    await setupTiersMocks(page);
    await page.route('**/api/releases/latest', async route => route.fulfill({ json: mockRelease }));
    await page.goto('/');
    await page.locator('[data-cy="pricing-section"]').scrollIntoViewIfNeeded();
    // Expand the pricing section (wrapped in ClientOnly) so the gradient overlay does not block the click
    await page.getByRole('button', { name: 'See all features' }).click({ timeout: 30000 });
    await page.getByRole('button', { name: 'Start now for free' }).first().click({ timeout: 30000 });

    await expect(page).toHaveURL(/.*\/download/);

    await expect(
      page.getByRole('heading', { level: 1, name: 'Download rotki for Windows, macOS and Linux' }),
    ).toBeVisible();
  });

  test('show links for mac', async ({ browser }) => {
    const context = await browser.newContext({
      userAgent:
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
    });
    const page = await context.newPage();
    await page.route('**/api/releases/latest', async route => route.fulfill({ json: mockRelease }));

    await page.goto('/download');

    // Mac has two download buttons (Apple Silicon and Intel)
    const appleSiliconButton = page.getByRole('button', { name: 'Download for macOS Apple Silicon' });
    const appleIntelButton = page.getByRole('button', { name: 'Download for macOS Intel' });

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

    await page.goto('/download');

    const linuxAppImageButton = page.locator('[data-cy="main-download-button"]').filter({ hasText: 'Download for Linux AppImage' });
    const linuxDebButton = page.locator('[data-cy="main-download-button"]').filter({ hasText: 'Download for Linux deb' });
    await expect(linuxAppImageButton).toBeVisible();
    await expect(linuxDebButton).toBeVisible();

    // Verify href values
    const appImageHref = await linuxAppImageButton.locator('..').getAttribute('href');
    expect(appImageHref).toBe('https://github.com/rotki/rotki/releases/download/v1.41.1/rotki-linux_x86_64-v1.41.1.AppImage');

    const debHref = await linuxDebButton.locator('..').getAttribute('href');
    expect(debHref).toBe('https://github.com/rotki/rotki/releases/download/v1.41.1/rotki-linux_amd64-v1.41.1.deb');

    await context.close();
  });

  test('show links for windows', async ({ browser }) => {
    const context = await browser.newContext({
      userAgent:
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
    });
    const page = await context.newPage();
    await page.route('**/api/releases/latest', async route => route.fulfill({ json: mockRelease }));

    await page.goto('/download');

    const windowsButton = page.locator('[data-cy="main-download-button"]').filter({ hasText: 'Download for Windows' });
    await expect(windowsButton).toBeVisible();

    // Verify href value
    const windowsHref = await windowsButton.locator('..').getAttribute('href');
    expect(windowsHref).toBe('https://github.com/rotki/rotki/releases/download/v1.41.1/rotki-win32_x64-v1.41.1.exe');

    await context.close();
  });

  test('checks all download links!', async ({ page }) => {
    await page.route('**/api/releases/latest', async route => route.fulfill({ json: mockRelease }));
    await page.goto('/download');

    // Each platform card links its builds directly; `exact` keeps the hero's "Download for …" button out
    const linuxAppImageLink = page.getByRole('link', { name: 'Linux AppImage', exact: true });
    const linuxDebLink = page.getByRole('link', { name: 'Linux deb', exact: true });
    const appleSiliconLink = page.getByRole('link', { name: 'macOS Apple Silicon', exact: true });
    const appleIntelLink = page.getByRole('link', { name: 'macOS Intel', exact: true });
    // Scoped to its card: the hero shows the same "Download for Windows" link when the browser reports Windows
    const windowsLink = page.locator('[data-cy="download-item"]')
      .filter({ has: page.getByRole('heading', { level: 3, name: 'Windows', exact: true }) })
      .getByRole('link', { name: 'Download for Windows', exact: true });

    await showAllDownloads(page, linuxAppImageLink);

    for (const heading of ['Linux', 'macOS', 'Windows', 'Docker'])
      await expect(page.getByRole('heading', { level: 3, name: heading, exact: true })).toBeVisible();

    await expect(page.locator('p').filter({ hasText: 'Latest release: v' }).first()).toBeVisible();

    const appImageHref = await linuxAppImageLink.getAttribute('href');
    expect(appImageHref).toContain('rotki-linux');
    expect(appImageHref).toContain('.AppImage');

    const debHref = await linuxDebLink.getAttribute('href');
    expect(debHref).toContain('rotki-linux');
    expect(debHref).toContain('.deb');

    const windowsHref = await windowsLink.getAttribute('href');
    expect(windowsHref).toContain('rotki-win32');
    expect(windowsHref).toContain('.exe');

    const appleSiliconHref = await appleSiliconLink.getAttribute('href');
    expect(appleSiliconHref).toContain('rotki-darwin_arm');
    expect(appleSiliconHref).toContain('.dmg');

    const appleIntelHref = await appleIntelLink.getAttribute('href');
    expect(appleIntelHref).toContain('rotki-darwin_x');
    expect(appleIntelHref).toContain('.dmg');

    const dockerCard = page.locator('[data-cy="download-item"]').filter({
      has: page.getByRole('heading', { level: 3, name: 'Docker', exact: true }),
    });
    const dockerInput = dockerCard.locator('input');
    await expect(dockerInput).toBeVisible();
    await expect(dockerInput).toHaveValue('docker pull rotki/rotki');
  });
});
