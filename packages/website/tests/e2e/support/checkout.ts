import type { FakeWallet } from './wallet';
import { expect, type Page } from '@playwright/test';

/** Billing period offered by the change-plan dialog. */
export type BillingPeriod = 'Monthly Billing' | 'Yearly billing';

/** Opens the autocomplete labelled `label` and picks the option showing `option`. */
export async function pickOption(page: Page, label: string, option: string): Promise<void> {
  const combobox = page.getByRole('combobox').filter({ hasText: label });
  await expect(combobox).toBeEnabled();
  await combobox.click();
  await page.locator('[aria-selected]').filter({ hasText: option }).first().click();
}

/**
 * Picks network and token on the payment request page.
 *
 * @remarks
 * The network is never preselected, and the token only when its chain offers a single one, so
 * both are always picked explicitly.
 */
export async function selectAsset(page: Page, network: string, token: string): Promise<void> {
  await pickOption(page, 'Network', network);
  await pickOption(page, 'Token', token);
}

/**
 * Ticks the checkbox named `name` by clicking the label text next to it.
 *
 * @remarks
 * These checkboxes are a 1px input behind their label, so the input itself does not toggle on
 * click and the text is the only reliable target. A label clicked before the page has settled is
 * swallowed, so the click repeats until the box really is checked — it is safe to repeat because
 * an already-checked box is left alone.
 */
async function tick(page: Page, name: RegExp, text: string): Promise<void> {
  const checkbox = page.getByRole('checkbox', { name });
  await expect(checkbox).toBeEnabled();
  await expect(async () => {
    if (!(await checkbox.isChecked()))
      await page.getByText(text).last().click();
    await expect(checkbox).toBeChecked({ timeout: 1_000 });
  }).toPass({ timeout: 15_000 });
}

/** Accepts the refund policy and continues to the crypto payment page. */
export async function acceptPolicyAndContinue(page: Page): Promise<void> {
  await tick(page, /Refunds\/Cancellation Policy/, 'I have read and agreed to the');
  await page.getByRole('button', { name: 'Continue' }).click();
  await expect(page).toHaveURL(/\/checkout\/pay\/crypto\?/);
}

/** Connects the fake wallet through the wallet picker. */
export async function connectWallet(page: Page, wallet: FakeWallet): Promise<void> {
  await page.getByRole('button', { name: 'Connect wallet' }).click();
  await page.getByRole('button', { name: wallet.options.name }).click();
}

/** Clicks `Pay with wallet` once it is enabled. */
export async function payWithWallet(page: Page): Promise<void> {
  const pay = page.getByRole('button', { name: 'Pay with wallet' });
  await expect(pay).toBeEnabled();
  await pay.click();
}

/** Asks the wallet to move to the chain the payment expects. */
export async function switchNetwork(page: Page): Promise<void> {
  await page.getByRole('button', { name: 'Switch Network' }).click();
}

/**
 * Switches to another plan through the order summary.
 *
 * @remarks
 * On the crypto payment page the dialog warns that a payment may already be on its way and
 * blocks the plan cards behind a confirmation, which `confirm` ticks.
 */
export async function changePlan(page: Page, options: { period: BillingPeriod; tier: string; confirm?: boolean }): Promise<void> {
  const { confirm = true, period, tier } = options;
  await page.getByRole('button', { name: 'Change', exact: true }).click();
  await expect(page.getByText('Change Plan')).toBeVisible();

  if (confirm)
    await tick(page, /Allow me to switch the plan/, 'Allow me to switch the plan');

  await page.getByRole('tab', { name: period }).click();
  await page.getByText(`${tier} plan`, { exact: true }).click();
}

/**
 * Confirms the change-payment dialog, which cancels whatever payment is pending.
 *
 * @remarks
 * Where it lands depends on the checkout: a renewal returns to the request page, an upgrade goes
 * back to the subscription page, and a failed cancellation stays put — so the caller asserts that.
 */
export async function confirmPaymentChange(page: Page): Promise<void> {
  await page.getByRole('button', { name: 'Change Payment' }).click();
  await tick(page, /Allow me to change the payment method/, 'Allow me to change the payment method');
  await page.getByRole('button', { name: 'Change Payment' }).last().click();
}

/** Cancels the pending payment through the change-payment dialog and returns to the request page. */
export async function changePaymentMethod(page: Page): Promise<void> {
  await confirmPaymentChange(page);
  await expect(page).toHaveURL(/\/checkout\/pay\/request-crypto\?/);
}

/** Waits for the pending success page the checkout shows once a transaction is on its way. */
export async function expectPendingSuccess(page: Page): Promise<void> {
  await expect(page).toHaveURL(/\/checkout\/success\?crypto=1/, { timeout: 15_000 });
  await expect(page.getByText('Transaction Pending')).toBeVisible();
}
