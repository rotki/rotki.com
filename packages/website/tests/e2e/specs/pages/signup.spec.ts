import { expect } from '@playwright/test';
import { completeAccountStep, completeDetailsStep, waitForSignupForm } from '../../support/signup';
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

  test('starts on the account step with the note about app accounts', async ({ page }) => {
    await page.goto('/signup');
    await waitForSignupForm(page);

    await expect(page.getByRole('heading', { level: 1, name: 'Create your account' })).toBeVisible();
    await expect(page.locator('[data-cy=signup-note]')).toContainText('separate from the user you create in the rotki app');
    await expect(page.locator('[data-cy=back-button]')).toHaveCount(0);
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

  test('links to sign in and keeps the query', async ({ page }) => {
    await page.goto('/signup?redirectUrl=%2Fcheckout%2Fpay%2Fmethod%3FplanId%3D3');
    await waitForSignupForm(page);

    const signIn = page.getByRole('main').getByRole('link', { name: 'Sign in' });
    await expect(signIn).toBeVisible();
    expect(decodeURIComponent(await signIn.getAttribute('href') ?? '')).toBe('/login?redirectUrl=/checkout/pay/method?planId=3');
  });

  test('each step has one page heading', async ({ page }) => {
    await page.goto('/signup');
    await waitForSignupForm(page);
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Create your account');

    await completeAccountStep(page);
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Your details');

    await completeDetailsStep(page);
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Billing address');

    await page.locator('button[data-cy=back-button]').first().click();
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Your details');
  });

  test('shows the step as text on phones and keeps back before continue', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/signup');
    await waitForSignupForm(page);
    await expect(page.locator('[data-cy=step-label]')).toHaveText('Step 1 of 3: Account');

    await completeAccountStep(page);
    await expect(page.locator('[data-cy=step-label]')).toHaveText('Step 2 of 3: Your details');

    const back = await page.locator('button[data-cy=back-button]').first().boundingBox();
    const next = await page.locator('button[data-cy=next-button]').first().boundingBox();
    expect(back && next && back.x < next.x && Math.abs(back.y - next.y) < 1).toBe(true);
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
    await expect(page.locator('[data-cy=signup-note]')).toBeVisible();
    await expect(page.getByText('This field is required.').first()).toBeVisible();

    await usernameInput.fill('username');
    await emailInput.fill('email@gmail.com');
    await passwordInput.fill('p455w0rD');
    await confirmPasswordInput.fill('p455w0rD');
    await nextButton.click();
    await expect(page.locator('input#first-name').first()).toBeVisible();
  });

  test('show customer information form', async ({ page }) => {
    await page.goto('/signup');

    await waitForSignupForm(page);
    await completeAccountStep(page);

    const firstNameInput = page.locator('input#first-name').first();
    const lastNameInput = page.locator('input#last-name').first();
    const companyNameInput = page.locator('input#company-name').first();
    const vatIdInput = page.locator('input#vat-id').first();
    const nextButton = page.locator('button[data-cy=next-button]').first();

    await expect(firstNameInput).toBeVisible();
    await expect(lastNameInput).toBeVisible();
    await expect(companyNameInput).toBeVisible();
    await expect(vatIdInput).toBeVisible();

    await nextButton.click();
    await expect(firstNameInput).toBeVisible();

    await firstNameInput.fill('First');
    await lastNameInput.fill('Last');
    await nextButton.click();
    await expect(page.locator('input#address-1').first()).toBeVisible();
  });

  test('show address form', async ({ page }) => {
    await page.goto('/signup');

    await waitForSignupForm(page);
    await completeAccountStep(page);
    await completeDetailsStep(page);

    const address1Input = page.locator('input#address-1').first();
    const address2Input = page.locator('input#address-2').first();
    const cityInput = page.locator('input#city').first();
    const postalInput = page.locator('input#postal').first();
    const countryInput = page.locator('#country input').first();
    const captcha = page.locator('div#signup-captcha').first();
    const tosInput = page.locator('input#tos').first();
    const newsletterConsentInput = page.locator('input#newsletter-consent').first();
    const submitButton = page.locator('button[data-cy=submit-button]').first();

    await expect(address1Input).toBeVisible();
    await expect(address2Input).toBeVisible();
    await expect(cityInput).toBeVisible();
    await expect(postalInput).toBeVisible();
    await expect(countryInput).toBeVisible();
    await expect(captcha).toBeVisible();
    await expect(tosInput).toBeVisible();
    await expect(newsletterConsentInput).toBeVisible();
    await expect(newsletterConsentInput).not.toBeChecked();

    await submitButton.click();
    await expect(page.getByText('Accept the terms to create your account.')).toBeVisible();

    await address1Input.fill('Address first line');
    await address2Input.fill('Address second line');
    await cityInput.fill('City');
    await postalInput.fill('11703');
    await tosInput.click();
  });

  test('checks signup postal input field for valid inputs!', async ({ page }) => {
    await page.goto('/signup');

    await waitForSignupForm(page);
    await completeAccountStep(page);
    await completeDetailsStep(page);

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
