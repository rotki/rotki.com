import type { Page } from '@playwright/test';

/**
 * Waits until Nuxt has hydrated the page.
 *
 * @remarks
 * A loaded page is not necessarily hydrated. On a cold dev server, as in CI, text typed into
 * prerendered inputs before hydration is lost and clicks land before their handlers exist.
 */
export async function waitForHydration(page: Page): Promise<void> {
  await page.waitForFunction(() => {
    const root = document.querySelector<HTMLElement & { __vue_app__?: { $nuxt?: { isHydrating?: boolean } } }>('#__nuxt');
    return root?.__vue_app__?.$nuxt?.isHydrating === false;
  }, undefined, { timeout: 30_000 });
}
