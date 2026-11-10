import { expect, type Page } from '@playwright/test';
import { waitForHydration } from './hydration';

/** Waits until the signup form's first step is visible and the page is hydrated. */
export async function waitForSignupForm(page: Page): Promise<void> {
  await expect(page.locator('input#username').first()).toBeVisible({ timeout: 30_000 });
  await waitForHydration(page);
}

/** Fills the account step with valid values and continues to the invoice details step. */
export async function completeAccountStep(page: Page): Promise<void> {
  await page.locator('input#username').first().fill('username');
  await page.locator('input#email').first().fill('email@gmail.com');
  await page.locator('input#password').first().fill('p455w0rD');
  await page.locator('input#password-confirmation').first().fill('p455w0rD');
  await page.locator('button[data-cy=next-button]').first().click();
}

/**
 * Fills the invoice details step with a name and a valid address, picks the first country matching
 * `country` and accepts the terms. The captcha is left to the caller.
 */
export async function fillInvoiceStep(page: Page, country: string): Promise<void> {
  await page.locator('input#first-name').first().fill('First');
  await page.locator('input#last-name').first().fill('Last');
  const countryInput = page.locator('#country input').first();
  await countryInput.click();
  await countryInput.fill(country);
  await page.getByRole('option', { name: country }).click();
  await expect(countryInput).toHaveValue(country);
  await page.locator('input#address-1').first().fill('Test Street 1');
  await page.locator('input#postal').first().fill('10115');
  await page.locator('input#city').first().fill('Berlin');
  await page.getByRole('checkbox', { name: /I agree to the/ }).check();
}
