import { expect, type Page } from '@playwright/test';
import { test as loggedInTest } from '../../support/fixtures';
import { test } from '../../support/test';

/**
 * Prerendered pages are rendered with no visitor: logged out, and with no screen size. A first client
 * render that differs from that HTML leaves stale attributes in production, since Vue only patches
 * text when hydration mismatches. The dev server these tests run against reports every mismatch.
 */
// `/` and `/products` render the plans and limits the site was built with, `/pricing` the full comparison
const PAGES: readonly string[] = ['/', '/pricing', '/products', '/download'];

/** Loads the page and returns the hydration warnings Vue logged while it hydrated. */
async function hydrationWarnings(page: Page, path: string): Promise<string[]> {
  const warnings: string[] = [];
  page.on('console', (message) => {
    if (/hydration/i.test(message.text()))
      warnings.push(message.text());
  });
  await page.goto(path);
  await page.waitForLoadState('networkidle');
  return warnings;
}

test.describe('hydration', () => {
  for (const path of PAGES) {
    test(`matches the prerendered HTML on ${path}`, async ({ page }) => {
      expect(await hydrationWarnings(page, path)).toEqual([]);
    });
  }

  test.describe('on a phone', () => {
    test.use({ hasTouch: true, isMobile: true, viewport: { height: 844, width: 390 } });

    for (const path of PAGES) {
      test(`matches the prerendered HTML on ${path}`, async ({ page }) => {
        expect(await hydrationWarnings(page, path)).toEqual([]);
      });
    }
  });
});

loggedInTest.describe('hydration when logged in', () => {
  for (const path of PAGES) {
    loggedInTest(`matches the prerendered HTML on ${path}`, async ({ page }) => {
      expect(await hydrationWarnings(page, path)).toEqual([]);
    });
  }

  loggedInTest('links the header to the account and lets the keyboard reach logout', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    await expect(page.getByRole('link', { name: 'My account' })).toHaveAttribute('href', '/home/subscription');
    await expect(page.getByRole('button', { name: 'Logout' })).toHaveAttribute('tabindex', '0');
  });
});
