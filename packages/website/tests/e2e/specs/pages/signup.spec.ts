import { expect } from '@playwright/test';
import { FAKE_CAPTCHA_TOKEN, installFakeRecaptcha, passCaptcha } from '../../support/recaptcha';
import { completeAccountStep, fillInvoiceStep, waitForSignupForm } from '../../support/signup';
import { test } from '../../support/test';

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

  test('starts on the account step and explains the account next to the form', async ({ page }) => {
    await page.goto('/signup');
    await waitForSignupForm(page);

    await expect(page.getByRole('heading', { level: 1, name: 'Create your account' })).toBeVisible();
    await expect(page.locator('[data-cy=signup-aside]')).toContainText('Your rotki user and your data stay on your computer');
    await expect(page.locator('[data-cy=signup-note]')).toBeHidden();
    await expect(page.locator('[data-cy=back-button]')).toHaveCount(0);
  });

  test('on phones, folds the note about app accounts into a question', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/signup');
    await waitForSignupForm(page);

    const note = page.locator('[data-cy=signup-note]');
    await expect(page.locator('[data-cy=signup-aside]')).toBeHidden();
    await expect(note.getByText('the two don\'t share passwords')).toBeHidden();
    await note.getByText('Is this my rotki app login?').click();
    await expect(note.getByText('the two don\'t share passwords')).toBeVisible();
  });

  test('ticks off the password rules while typing', async ({ page }) => {
    await page.goto('/signup');
    await waitForSignupForm(page);

    const rules = page.locator('li[data-met]');
    await expect(rules).toHaveCount(2);
    await expect(rules.nth(0)).toHaveAttribute('data-met', 'false');

    await page.locator('input#password').first().fill('12345678');
    await expect(rules.nth(0)).toHaveAttribute('data-met', 'true');
    await expect(rules.nth(1)).toHaveAttribute('data-met', 'false');

    await page.locator('input#password').first().fill('p455w0rD');
    await expect(rules.nth(1)).toHaveAttribute('data-met', 'true');
  });

  test('links to sign in from the header and keeps the query', async ({ page }) => {
    await page.goto('/signup?redirectUrl=%2Fcheckout%2Fpay%2Fmethod%3FplanId%3D3');
    await waitForSignupForm(page);

    const signIn = page.getByRole('banner').getByRole('link', { name: 'Sign in' });
    await expect(signIn).toBeVisible();
    expect(decodeURIComponent(await signIn.getAttribute('href') ?? '')).toBe('/login?redirectUrl=/checkout/pay/method?planId=3');
  });

  test('each step has one page heading', async ({ page }) => {
    await page.goto('/signup');
    await waitForSignupForm(page);
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Create your account');

    await completeAccountStep(page);
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Invoice details');

    await page.locator('button[data-cy=back-button]').first().click();
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Create your account');
    await expect(page.locator('input#username').first()).toHaveValue('username');
  });

  test('shows who is signing up next to the invoice details, with a way back', async ({ page }) => {
    await page.goto('/signup');
    await waitForSignupForm(page);
    await completeAccountStep(page);

    const aside = page.getByRole('complementary');
    await expect(aside).toContainText('Signing up as');
    await expect(aside).toContainText('email@gmail.com');
    await aside.getByRole('button', { name: 'Edit' }).click();
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Create your account');
  });

  test('on phones, names the step and keeps the actions on screen', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/signup');
    await waitForSignupForm(page);
    await expect(page.locator('[data-cy=step-label]')).toHaveText('Step 1 of 2: Account');

    await completeAccountStep(page);
    await expect(page.locator('[data-cy=step-label]')).toHaveText('Step 2 of 2: Invoice details');
    await expect(page.locator('[data-cy=signing-up-as]')).toContainText('email@gmail.com');

    const back = await page.locator('button[data-cy=back-button]').first().boundingBox();
    const submit = await page.locator('button[data-cy=submit-button]').first().boundingBox();
    expect(back && submit && back.x < submit.x && Math.abs(back.y - submit.y) < 1).toBe(true);
    // The form is taller than the screen, but the actions stick to its bottom edge.
    expect(submit && submit.y + submit.height <= 844).toBe(true);
  });

  test('show account form', async ({ page }) => {
    await page.goto('/signup');

    await waitForSignupForm(page);

    const usernameInput = page.locator('input#username').first();
    const emailInput = page.locator('input#email').first();
    const passwordInput = page.locator('input#password').first();
    const confirmPasswordInput = page.locator('input#password-confirmation').first();
    const nextButton = page.locator('button[data-cy=next-button]').first();

    await expect(usernameInput).toBeVisible();
    await expect(emailInput).toBeVisible();
    await expect(passwordInput).toBeVisible();
    await expect(confirmPasswordInput).toBeVisible();

    // An empty form stays on the step and says what is missing.
    await nextButton.click();
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Create your account');
    await expect(page.getByText('This field is required.').first()).toBeVisible();

    await usernameInput.fill('username');
    await emailInput.fill('email@gmail.com');
    await passwordInput.fill('p455w0rD');
    await confirmPasswordInput.fill('p455w0rD');
    await nextButton.click();
    await expect(page.locator('input#first-name').first()).toBeVisible();
  });

  test('show invoice details form', async ({ page }) => {
    await page.goto('/signup');

    await waitForSignupForm(page);
    await completeAccountStep(page);

    await expect(page.locator('input#first-name').first()).toBeVisible();
    await expect(page.locator('input#last-name').first()).toBeVisible();
    await expect(page.locator('#country input').first()).toBeVisible();
    await expect(page.locator('input#address-1').first()).toBeVisible();
    await expect(page.locator('input#address-2').first()).toBeVisible();
    await expect(page.locator('input#postal').first()).toBeVisible();
    await expect(page.locator('input#city').first()).toBeVisible();
    await expect(page.locator('div#signup-captcha').first()).toBeVisible();
    await expect(page.locator('input#tos').first()).toBeVisible();
    await expect(page.locator('input#newsletter-consent').first()).not.toBeChecked();

    // Country comes before the street.
    const country = await page.locator('#country input').first().boundingBox();
    const street = await page.locator('input#address-1').first().boundingBox();
    expect(country && street && country.y < street.y).toBe(true);

    await page.locator('button[data-cy=submit-button]').first().click();
    await expect(page.getByText('Accept the terms to create your account.')).toBeVisible();
    await expect(page.getByText('This field is required.').first()).toBeVisible();
  });

  test('asks for company name and VAT ID only for company purchases', async ({ page }) => {
    await page.goto('/signup');
    await waitForSignupForm(page);
    await completeAccountStep(page);

    await expect(page.locator('input#company-name')).toHaveCount(0);
    await expect(page.locator('input#vat-id')).toHaveCount(0);

    await page.getByText('I\'m buying for a company').click();
    await expect(page.locator('input#company-name').first()).toBeVisible();
    await expect(page.locator('input#vat-id').first()).toBeVisible();
  });

  test('creates the account and asks to confirm the e-mail', async ({ page }) => {
    let requestBody: Record<string, unknown> | undefined;
    await installFakeRecaptcha(page);
    await page.route('**/webapi/signup/', async (route) => {
      requestBody = route.request().postDataJSON();
      await route.fulfill({ json: { result: true } });
    });
    await page.goto('/signup');
    await waitForSignupForm(page);
    await completeAccountStep(page);
    await fillInvoiceStep(page, 'Country');
    await passCaptcha(page);
    await page.locator('button[data-cy=submit-button]').first().click();

    await page.waitForURL('**/activation');
    await expect(page.getByRole('heading', { level: 1, name: 'Check your inbox' })).toBeVisible();
    await expect(page.locator('[data-cy=sent-to]')).toHaveText('email@gmail.com');
    expect(page.url()).not.toContain('email');
    expect(requestBody).toMatchObject({
      address_1: 'Test Street 1',
      captcha: FAKE_CAPTCHA_TOKEN,
      city: 'Berlin',
      company_name: '',
      country: 'CT',
      email: 'email@gmail.com',
      first_name: 'First',
      last_name: 'Last',
      newsletter_consent: false,
      postcode: '10115',
      username: 'username',
      vat_id: '',
    });
  });

  test('sends the company when buying for one', async ({ page }) => {
    let requestBody: Record<string, unknown> | undefined;
    await installFakeRecaptcha(page);
    await page.route('**/webapi/signup/', async (route) => {
      requestBody = route.request().postDataJSON();
      await route.fulfill({ json: { result: true } });
    });
    await page.goto('/signup');
    await waitForSignupForm(page);
    await completeAccountStep(page);
    await fillInvoiceStep(page, 'Country');
    await page.getByText('I\'m buying for a company').click();
    await page.locator('input#company-name').first().fill('Rotki Test GmbH');
    await page.locator('input#vat-id').first().fill('DE123456789');
    await passCaptcha(page);
    await page.locator('button[data-cy=submit-button]').first().click();

    await page.waitForURL('**/activation');
    expect(requestBody).toMatchObject({
      company_name: 'Rotki Test GmbH',
      vat_id: 'DE123456789',
    });
  });

  test('goes back to the account step when the backend rejects the password', async ({ page }) => {
    await installFakeRecaptcha(page);
    await page.route('**/webapi/signup/', async route => route.fulfill({
      status: 400,
      json: { message: { password: ['This password is too common.'] } },
    }));
    await page.goto('/signup');
    await waitForSignupForm(page);
    await completeAccountStep(page);
    await fillInvoiceStep(page, 'Country');
    await passCaptcha(page);
    await page.locator('button[data-cy=submit-button]').first().click();

    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Create your account');
    await expect(page.getByText('This password is too common.')).toBeVisible();
    await expect(page.locator('input#password').first()).toHaveAttribute('aria-invalid', 'true');
    expect(new URL(page.url()).pathname).toBe('/signup');
  });

  test('opens the company fields when the backend rejects the VAT ID', async ({ page }) => {
    await installFakeRecaptcha(page);
    await page.route('**/webapi/signup/', async route => route.fulfill({
      status: 400,
      json: { message: { vat_id: ['VAT ID is invalid.'] } },
    }));
    await page.goto('/signup');
    await waitForSignupForm(page);
    await completeAccountStep(page);
    await fillInvoiceStep(page, 'Country');
    await page.getByText('I\'m buying for a company').click();
    await page.locator('input#company-name').first().fill('Rotki Test GmbH');
    await page.locator('input#vat-id').first().fill('XX1');
    await passCaptcha(page);
    await page.locator('button[data-cy=submit-button]').first().click();

    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Invoice details');
    await expect(page.getByText('VAT ID is invalid.')).toBeVisible();
    await expect(page.locator('input#vat-id').first()).toHaveValue('XX1');
  });

  test('checks signup postal input field for valid inputs!', async ({ page }) => {
    await page.goto('/signup');

    await waitForSignupForm(page);
    await completeAccountStep(page);

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
    await postalInput.blur();
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
