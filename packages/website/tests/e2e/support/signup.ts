import { expect, type Page } from '@playwright/test';
import { waitForHydration } from './hydration';

/** Waits until the signup form's first step is visible and the page is hydrated. */
export async function waitForSignupForm(page: Page): Promise<void> {
  await expect(page.locator('input#username').first()).toBeVisible({ timeout: 30_000 });
  await waitForHydration(page);
}

/** Fills the account step with valid values and continues to the details step. */
export async function completeAccountStep(page: Page): Promise<void> {
  await page.locator('input#username').first().fill('username');
  await page.locator('input#email').first().fill('email@gmail.com');
  await page.locator('input#password').first().fill('p455w0rD');
  await page.locator('input#password-confirmation').first().fill('p455w0rD');
  await page.locator('button[data-cy=next-button]').first().click();
}

/** Fills the required details and continues to the address step. */
export async function completeDetailsStep(page: Page): Promise<void> {
  await page.locator('input#first-name').first().fill('First');
  await page.locator('input#last-name').first().fill('Last');
  await page.locator('button[data-cy=next-button]').first().click();
}
