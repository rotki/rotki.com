import { expect, type Page } from '@playwright/test';

/**
 * Moves the signup form from its introduction to the account step.
 *
 * @remarks
 * `networkidle` does not mean the page has hydrated. On a cold dev server, as in CI, the Continue
 * click can land before its handler is attached and do nothing, leaving the form on the introduction.
 * The click repeats until the account step shows; it is safe to repeat, since the account step's own
 * button stays disabled until the form is filled in.
 */
export async function continuePastIntroduction(page: Page): Promise<void> {
  const username = page.locator('input#username').first();
  await expect(async () => {
    if (!(await username.isVisible()))
      await page.locator('[data-cy=next-button]').first().click();
    await expect(username).toBeVisible({ timeout: 1_000 });
  }).toPass({ timeout: 30_000 });
}
