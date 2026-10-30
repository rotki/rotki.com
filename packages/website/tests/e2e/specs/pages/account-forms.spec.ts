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

/** Opens Billing and its invoice details form, which holds the name, VAT ID and address forms. */
async function openInvoiceDetails(page: Page): Promise<void> {
  await open(page, '/home/billing');
  await page.getByRole('main').getByRole('button', { name: 'Edit', exact: true }).click();
}

/** The submit button of the form that holds `field`. */
function submitButton(page: Page, field: string, name = 'Save') {
  return page.locator('form').filter({ has: page.locator(field) }).getByRole('button', { name, exact: true });
}

test.describe('account forms', () => {
  test('address: an emptied required field blocks saving until it is filled', async ({ page }) => {
    const requests = await mockProfileUpdate(page);
    await openInvoiceDetails(page);

    const city = page.locator('input#city').first();
    await expect(city).toHaveValue('Berlin');
    await city.fill('');
    await expect(page.getByText('This field is required.')).toBeVisible();
    await expect(submitButton(page, 'input#city')).toBeDisabled();

    await city.fill('Hamburg');
    await page.locator('input#postal').first().fill('12#4');
    await expect(page.getByText('Enter a valid postal code')).toBeVisible();
    await expect(submitButton(page, 'input#city')).toBeDisabled();

    await page.locator('input#postal').first().fill('20095');
    await expect(submitButton(page, 'input#city')).toBeEnabled();
    await submitButton(page, 'input#city').click();

    await expect(page.getByText('Your changes have been successfully saved!')).toBeVisible();
    expect(requests).toHaveLength(1);
    expect(requests[0]?.postDataJSON()).toMatchObject({ city: 'Hamburg', postcode: '20095' });
  });

  test('customer information: names are required, company and VAT ID are not', async ({ page }) => {
    const requests = await mockProfileUpdate(page);
    await openInvoiceDetails(page);

    const firstName = page.locator('input#first-name').first();
    await expect(firstName).toHaveValue('Test');
    await firstName.fill('');
    await expect(page.getByText('This field is required.')).toBeVisible();
    await expect(submitButton(page, 'input#first-name')).toBeDisabled();

    await firstName.fill('Alice');
    await page.locator('input#company-name').first().fill('');
    await submitButton(page, 'input#first-name').click();

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
    await page.getByRole('main').getByRole('button', { name: 'Change', exact: true }).click();

    await page.locator('input#current-password').first().fill('old-p455w0rD');
    await page.locator('input#new-password').first().fill('12345678');
    const onlyNumbers = page.locator('li[data-met]').nth(1);
    await expect(onlyNumbers).toHaveAttribute('data-met', 'false');
    await expect(onlyNumbers).toHaveClass(/text-rui-error/);
    await page.locator('input#password-confirmation').first().fill('something-else');
    await expect(page.getByText('The passwords do not match.')).toBeVisible();
    await expect(submitButton(page, 'input#new-password', 'Change password')).toBeDisabled();

    await page.locator('input#new-password').first().fill('n3wP4ssword');
    await page.locator('input#password-confirmation').first().fill('n3wP4ssword');
    await submitButton(page, 'input#new-password', 'Change password').click();

    await expect.poll(() => requests.length).toBe(1);
    expect(requests[0]?.postDataJSON()).toMatchObject({ current_password: 'old-p455w0rD', new_password: 'n3wP4ssword' });
    await expect(page.getByText('Your password has been changed')).toBeVisible();
    await expect(page.locator('input#new-password')).toHaveCount(0);
  });

  test('e-mail preferences: saves the newsletter choice when the switch flips', async ({ page }) => {
    const requests = await mockProfileUpdate(page);
    await open(page, '/home/account-details');

    await page.getByText('Product updates and news', { exact: true }).click();

    await expect.poll(() => requests.length).toBe(1);
    expect(requests[0]?.postDataJSON()).toMatchObject({ newsletter_consent: true });
  });
});
