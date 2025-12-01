import { expect, test } from '@playwright/test';

test.describe('signup test', () => {
  test.beforeEach(async ({ page }) => {
    await page.route('/webapi/countries/', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          result: [{ code: 'CT', name: 'Country' }],
        }),
      });
    });
  });

  test('show introduction page', async ({ page }) => {
    await page.goto('/signup');
    await page.waitForLoadState('networkidle');

    await expect(page.getByText('Important Note')).toBeVisible();
    await expect(page.locator('[data-cy=next-button]')).toBeVisible();
    await expect(page.locator('[data-cy=next-button]')).toBeEnabled();
  });

  test('show account form', async ({ page }) => {
    await page.goto('/signup');
    await page.waitForLoadState('networkidle');

    // Navigate past introduction
    await page.locator('[data-cy=next-button]').click();

    const usernameInput = page.locator('input#username').first();
    const emailInput = page.locator('input#email').first();
    const passwordInput = page.locator('input#password').first();
    const confirmPasswordInput = page.locator('input#password-confirmation').first();
    const nextButton = page.locator('button[data-cy=next-button]').first();

    await expect(usernameInput).toBeVisible();
    await expect(emailInput).toBeVisible();
    await expect(passwordInput).toBeVisible();
    await expect(confirmPasswordInput).toBeVisible();
    await expect(nextButton).toBeDisabled();

    await usernameInput.fill('username');
    await emailInput.fill('email@gmail.com');
    await passwordInput.fill('p455w0rD');
    await confirmPasswordInput.fill('p455w0rD');
    await expect(nextButton).toBeEnabled();
  });

  test('show customer information form', async ({ page }) => {
    await page.goto('/signup');
    await page.waitForLoadState('networkidle');

    // Navigate past introduction
    await page.locator('[data-cy=next-button]').click();

    // Fill account form
    await page.locator('input#username').first().fill('username');
    await page.locator('input#email').first().fill('email@gmail.com');
    await page.locator('input#password').first().fill('p455w0rD');
    await page.locator('input#password-confirmation').first().fill('p455w0rD');
    await page.locator('button[data-cy=next-button]').first().click();

    const firstNameInput = page.locator('input#first-name').first();
    const lastNameInput = page.locator('input#last-name').first();
    const companyNameInput = page.locator('input#company-name').first();
    const vatIdInput = page.locator('input#vat-id').first();
    const nextButton = page.locator('button[data-cy=next-button]').first();

    await expect(firstNameInput).toBeVisible();
    await expect(lastNameInput).toBeVisible();
    await expect(companyNameInput).toBeVisible();
    await expect(vatIdInput).toBeVisible();
    await expect(nextButton).toBeDisabled();

    await firstNameInput.fill('First');
    await lastNameInput.fill('Last');
    await nextButton.click();
  });

  test('show address form', async ({ page }) => {
    await page.goto('/signup');
    await page.waitForLoadState('networkidle');

    // Navigate past introduction
    await page.locator('[data-cy=next-button]').click();

    // Fill account form
    await page.locator('input#username').first().fill('username');
    await page.locator('input#email').first().fill('email@gmail.com');
    await page.locator('input#password').first().fill('p455w0rD');
    await page.locator('input#password-confirmation').first().fill('p455w0rD');
    await page.locator('button[data-cy=next-button]').first().click();

    // Fill customer info form
    await page.locator('input#first-name').first().fill('First');
    await page.locator('input#last-name').first().fill('Last');
    await page.locator('button[data-cy=next-button]').first().click();

    const address1Input = page.locator('input#address-1').first();
    const address2Input = page.locator('input#address-2').first();
    const cityInput = page.locator('input#city').first();
    const postalInput = page.locator('input#postal').first();
    const countryInput = page.locator('#country input').first();
    const captcha = page.locator('div#signup-captcha').first();
    const tosInput = page.locator('input#tos').first();
    const submitButton = page.locator('button[data-cy=submit-button]').first();

    await expect(address1Input).toBeVisible();
    await expect(address2Input).toBeVisible();
    await expect(cityInput).toBeVisible();
    await expect(postalInput).toBeVisible();
    await expect(countryInput).toBeVisible();
    await expect(captcha).toBeVisible();
    await expect(tosInput).toBeVisible();
    await expect(submitButton).toBeDisabled();

    await address1Input.fill('Address first line');
    await address2Input.fill('Address second line');
    await cityInput.fill('City');
    await postalInput.fill('11703');
    await tosInput.click();
  });

  test('checks signup postal input field for valid inputs!', async ({ page }) => {
    await page.goto('/signup');
    await page.waitForLoadState('networkidle');

    // Navigate past introduction
    await page.locator('[data-cy=next-button]').click();

    // Fill account form
    await page.locator('input#username').first().fill('username');
    await page.locator('input#email').first().fill('email@gmail.com');
    await page.locator('input#password').first().fill('p455w0rD');
    await page.locator('input#password-confirmation').first().fill('p455w0rD');
    await page.locator('button[data-cy=next-button]').first().click();

    // Fill customer info form
    await page.locator('input#first-name').first().fill('First');
    await page.locator('input#last-name').first().fill('Last');
    await page.locator('button[data-cy=next-button]').first().click();

    const postalInput = page.locator('input#postal').first();
    const postalError = page.locator('[data-cy=postal] .details .text-rui-error').first();

    // Valid inputs
    await postalInput.fill('12345');
    await expect(page.locator('[data-cy=postal] .details .text-rui-error')).not.toBeVisible();

    await postalInput.clear();
    await postalInput.fill('ABC-40');
    await expect(page.locator('[data-cy=postal] .details .text-rui-error')).not.toBeVisible();

    await postalInput.clear();
    await postalInput.fill('ABC-40 224');
    await expect(page.locator('[data-cy=postal] .details .text-rui-error')).not.toBeVisible();

    // Invalid inputs
    await postalInput.clear();
    await postalInput.fill('12@345');
    await expect(postalError).toBeVisible();

    await postalInput.clear();
    await postalInput.fill('12#345');
    await expect(postalError).toBeVisible();

    await postalInput.clear();
    await postalInput.fill('.');
    await expect(postalError).toBeVisible();

    // Valid again
    await postalInput.clear();
    await postalInput.fill('105102');
    await expect(page.locator('#postal .details .text-rui-error')).not.toBeVisible();
  });
});
