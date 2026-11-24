import { expect, type Page } from '@playwright/test';
import { creditWithHistory, referralWithCode } from '../../support/account-data';
import { test } from '../../support/fixtures';
import { waitForHydration } from '../../support/hydration';

async function openOverview(page: Page): Promise<void> {
  await page.goto('/home/subscription');
  await waitForHydration(page);
}

function creditTile(page: Page) {
  return page.getByRole('main').getByTestId('overview-credit');
}

test.describe('account overview referral code', () => {
  test.describe('with a referral code', () => {
    test.use({ backendScenario: { credit: creditWithHistory(), referral: referralWithCode('FRIEND10') } });

    test('shows the code next to the credit and links to the referral section on Billing', async ({ page }) => {
      await openOverview(page);

      const tile = creditTile(page);
      await expect(tile).toContainText('12.50 €');
      await expect(tile.getByRole('group', { name: 'Your referral code' })).toContainText('FRIEND10');
      await expect(tile.getByRole('button', { name: 'Copy to clipboard' })).toBeVisible();
      await expect(tile.getByRole('button', { name: 'Create referral code' })).toHaveCount(0);

      // The section renders once the account loads; a slow answer puts that after the browser's own jump to the hash.
      await page.route('**/webapi/account/', async (route) => {
        await new Promise(resolve => setTimeout(resolve, 1500));
        await route.fallback();
      });
      await tile.getByRole('link', { name: 'Share it or see credit history' }).click();
      await page.waitForURL('**/home/billing#refer-a-friend');
      const section = page.getByRole('main').getByRole('region', { name: 'Refer a friend' });
      await expect(section.getByRole('textbox', { name: 'Referral code' })).toHaveValue('FRIEND10');
      const heading = section.getByRole('heading', { name: 'Refer a friend' });
      await expect.poll(async () => (await heading.boundingBox())?.y).toBeLessThan(100);
    });
  });

  test.describe('without a referral code', () => {
    test('creates one from the credit tile', async ({ backend, page }) => {
      await openOverview(page);

      const tile = creditTile(page);
      await tile.getByRole('button', { name: 'Create referral code' }).click();

      await expect(tile.getByRole('group', { name: 'Your referral code' })).toContainText('FRIEND10');
      await expect(tile.getByRole('button', { name: 'Create referral code' })).toHaveCount(0);
      await expect(tile.getByRole('button', { name: 'Copy to clipboard' })).toBeFocused();
      expect(backend.callsTo('POST', '/webapi/2/referral')).toHaveLength(1);
    });
  });
});
