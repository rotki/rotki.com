import { expect, type Page, type Request } from '@playwright/test';
import { defaultAccount } from '../../support/backend-data';
import { test } from '../../support/fixtures';
import { waitForHydration } from '../../support/hydration';

/** Answers profile updates the way the backend does: with the saved address and consent. */
async function mockProfileUpdate(page: Page): Promise<Request[]> {
  const requests: Request[] = [];
  await page.route('**/webapi/account/', async (route) => {
    if (route.request().method() !== 'PATCH') {
      await route.fallback();
      return;
    }
    requests.push(route.request());
    const { address, newsletter_consent } = defaultAccount();
    await route.fulfill({ json: { result: { address, newsletter_consent } } });
  });
  return requests;
}

async function open(page: Page, path: string): Promise<void> {
  await page.goto(path);
  await waitForHydration(page);
}

function updateButton(page: Page) {
  return page.getByRole('main').getByRole('button', { name: 'Update' });
}

test.describe('account forms', () => {
  test('address: an emptied required field blocks the update until it is filled', async ({ page }) => {
    const requests = await mockProfileUpdate(page);
    await open(page, '/home/address');

    const city = page.locator('input#city').first();
    await expect(city).toHaveValue('Berlin');
    await city.fill('');
    await expect(page.getByText('This field is required.')).toBeVisible();
    await expect(updateButton(page)).toBeDisabled();

    await city.fill('Hamburg');
    await page.locator('input#postal').first().fill('12#4');
    await expect(page.getByText('Enter a valid postal code')).toBeVisible();
    await expect(updateButton(page)).toBeDisabled();

    await page.locator('input#postal').first().fill('20095');
    await expect(updateButton(page)).toBeEnabled();
    await updateButton(page).click();

    await expect(page.getByText('Your changes have been successfully saved!')).toBeVisible();
    expect(requests).toHaveLength(1);
    expect(requests[0]?.postDataJSON()).toMatchObject({ city: 'Hamburg', postcode: '20095' });
  });

  test('customer information: names are required, company and VAT ID are not', async ({ page }) => {
    const requests = await mockProfileUpdate(page);
    await open(page, '/home/customer-information');

    const firstName = page.locator('input#first-name').first();
    await expect(firstName).toHaveValue('Test');
    await firstName.fill('');
    await expect(page.getByText('This field is required.')).toBeVisible();
    await expect(updateButton(page)).toBeDisabled();

    await firstName.fill('Alice');
    await page.locator('input#company-name').first().fill('');
    await updateButton(page).click();

    await expect(page.getByText('Your changes have been successfully saved!')).toBeVisible();
    expect(requests[0]?.postDataJSON()).toMatchObject({ first_name: 'Alice', company_name: '' });
  });

  test('change password: checks the rules and the confirmation before sending', async ({ page }) => {
    const requests: Request[] = [];
    await page.route('**/webapi/change-password/', async (route) => {
      requests.push(route.request());
      await route.fulfill({ json: { result: true } });
    });
    await open(page, '/home/account-details');

    await page.locator('input#current-password').first().fill('old-p455w0rD');
    await page.locator('input#new-password').first().fill('12345678');
    const onlyNumbers = page.locator('li[data-met]').nth(1);
    await expect(onlyNumbers).toHaveAttribute('data-met', 'false');
    await expect(onlyNumbers).toHaveClass(/text-rui-error/);
    await page.locator('input#password-confirmation').first().fill('something-else');
    await expect(page.getByText('The passwords do not match.')).toBeVisible();
    await expect(updateButton(page)).toBeDisabled();

    await page.locator('input#new-password').first().fill('n3wP4ssword');
    await page.locator('input#password-confirmation').first().fill('n3wP4ssword');
    await updateButton(page).click();

    await expect.poll(() => requests.length).toBe(1);
    expect(requests[0]?.postDataJSON()).toMatchObject({ current_password: 'old-p455w0rD', new_password: 'n3wP4ssword' });
    await expect(page.locator('input#new-password').first()).toHaveValue('');
  });

  test('e-mail preferences: saves the newsletter choice', async ({ page }) => {
    const requests = await mockProfileUpdate(page);
    await open(page, '/home/email-preferences');

    const save = page.locator('[data-cy=update-email-preferences]');
    await expect(save).toBeDisabled();
    await page.getByText('I would like to receive product updates and news from rotki.').click();
    await expect(page.locator('input#newsletter-consent').first()).toBeChecked();
    await expect(save).toBeEnabled();
    await save.click();

    await expect.poll(() => requests.length).toBe(1);
    expect(requests[0]?.postDataJSON()).toMatchObject({ newsletter_consent: true });
  });
});
