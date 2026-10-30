import type { Page } from '@playwright/test';

export const FAKE_CAPTCHA_TOKEN = 'e2e-captcha-token';

/**
 * Replaces Google reCAPTCHA with a button that passes the captcha when clicked.
 *
 * @remarks
 * The captcha component renders into `window.grecaptcha` when it already exists and only loads
 * Google's script otherwise, so defining it before the page loads keeps the test offline. Each
 * click hands out the same token; `reset` puts the button back, like a solved widget that expired.
 */
export async function installFakeRecaptcha(page: Page): Promise<void> {
  await page.addInitScript((token) => {
    interface RenderOptions { callback: (value: string) => void }
    const widgets: { element: HTMLElement; options: RenderOptions }[] = [];

    function draw(index: number): void {
      const widget = widgets[index];
      if (!widget)
        return;
      const button = document.createElement('button');
      button.type = 'button';
      button.textContent = 'Pass captcha';
      button.dataset.cy = 'fake-captcha';
      button.addEventListener('click', () => {
        button.textContent = 'Captcha passed';
        widget.options.callback(token);
      });
      widget.element.replaceChildren(button);
    }

    Object.defineProperty(window, 'grecaptcha', {
      configurable: true,
      value: {
        render: (element: HTMLElement, options: RenderOptions): number => {
          widgets.push({ element, options });
          draw(widgets.length - 1);
          return widgets.length - 1;
        },
        reset: (id?: number): void => draw(id ?? 0),
      },
    });
  }, FAKE_CAPTCHA_TOKEN);
}

/** Clicks the fake captcha so the form receives a token. */
export async function passCaptcha(page: Page): Promise<void> {
  await page.locator('[data-cy=fake-captcha]').first().click();
}
