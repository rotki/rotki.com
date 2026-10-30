import { expect, type Locator, type Page } from '@playwright/test';
import { defaultAccount } from '../../support/backend-data';
import { waitForHydration } from '../../support/hydration';
import { test } from '../../support/test';

async function mockSignedOut(page: Page): Promise<void> {
  await page.route('**/webapi/csrf/**', async route => route.fulfill({ json: { detail: 'CSRF cookie set' } }));
  await page.route('**/webapi/account/', async route => route.fulfill({ status: 401, json: { message: 'Not authenticated' } }));
}

/** The page content without the site header, which has its own "Sign in" link. */
function main(page: Page): Locator {
  return page.getByRole('main');
}

function heading(page: Page, name: string): Locator {
  return main(page).getByRole('heading', { level: 1, name });
}

test.beforeEach(async ({ page }) => {
  await mockSignedOut(page);
});

test.describe('sign in', () => {
  test('shows the form with links to recovery and signup', async ({ page }) => {
    await page.goto('/login');

    await expect(heading(page, 'Sign in')).toBeVisible();
    await expect(page).toHaveTitle(/^Sign in/);
    await expect(main(page).getByRole('link', { name: 'Forgot password?' })).toHaveAttribute('href', '/password/recover');
    await expect(main(page).getByRole('link', { name: 'Create one' })).toHaveAttribute('href', /^\/signup/);
  });

  test('says what is missing instead of sending an empty form', async ({ page }) => {
    let requests = 0;
    await page.route('**/webapi/login/', async (route) => {
      requests++;
      await route.fulfill({ status: 400, json: { message: 'x' } });
    });
    await page.goto('/login');
    await waitForHydration(page);

    await main(page).getByRole('button', { name: 'Sign in' }).click();

    await expect(main(page).getByText('Enter your e-mail or username.')).toBeVisible();
    await expect(main(page).getByText('Enter your password.')).toBeVisible();
    expect(requests).toBe(0);
  });

  test('sends one request on Enter and shows the error once, with the note about app accounts', async ({ page }) => {
    let requests = 0;
    await page.route('**/webapi/login/', async (route) => {
      requests++;
      await route.fulfill({ status: 400, json: { message: 'Unable to log in with provided credentials.' } });
    });
    await page.goto('/login');
    await waitForHydration(page);

    await page.locator('input#username').first().fill('testuser');
    await page.locator('input#password').first().fill('wrong-password');
    await page.locator('input#password').first().press('Enter');

    const alert = main(page).getByRole('alert');
    await expect(alert).toContainText('Unable to log in with provided credentials.');
    await expect(alert).toContainText('separate from the user you created in the rotki app');
    await expect(main(page).getByText('Unable to log in with provided credentials.')).toHaveCount(1);
    await expect(page.locator('input#username').first()).toHaveAttribute('aria-invalid', 'true');
    expect(requests).toBe(1);
    expect(new URL(page.url()).pathname).toBe('/login');
  });

  test('goes to the subscription page after signing in', async ({ page }) => {
    let signedIn = false;
    await page.route('**/webapi/login/', async (route) => {
      signedIn = true;
      await route.fulfill({ json: { result: true } });
    });
    await page.route('**/webapi/account/', async route => signedIn
      ? route.fulfill({ json: { result: defaultAccount() } })
      : route.fulfill({ status: 401, json: { message: 'Not authenticated' } }));
    await page.goto('/login');
    await waitForHydration(page);

    await page.locator('input#username').first().fill('testuser');
    await page.locator('input#password').first().fill('p455w0rD');
    await main(page).getByRole('button', { name: 'Sign in' }).click();

    await page.waitForURL('**/home/subscription');
  });
});

test.describe('password recovery', () => {
  test('asks for the e-mail address', async ({ page }) => {
    await page.goto('/password/recover');

    await expect(heading(page, 'Reset your password')).toBeVisible();
    await expect(main(page).getByRole('link', { name: 'Sign in' })).toHaveAttribute('href', '/login');
    await waitForHydration(page);

    await page.locator('input#email').first().fill('not-an-address');
    await main(page).getByRole('button', { name: 'Send reset link' }).click();
    await expect(main(page).getByText('Enter a valid e-mail address.')).toBeVisible();
  });

  test('confirms the link was sent and offers a new one', async ({ page }) => {
    await page.goto('/password/send');

    await expect(heading(page, 'Check your inbox')).toBeVisible();
    await expect(main(page)).toContainText('the e-mail address of your account');
    await expect(main(page).getByRole('link', { name: 'request a new link' })).toHaveAttribute('href', '/password/recover');
    await expect(main(page).getByRole('link', { name: 'Back to sign in' })).toHaveAttribute('href', '/login');
  });

  test('names the address the recovery form left in history state', async ({ page }) => {
    await page.addInitScript(() => history.replaceState({ ...history.state, email: 'someone@example.com' }, ''));
    await page.goto('/password/send');

    await expect(main(page)).toContainText('We sent a link to someone@example.com.');
    expect(page.url()).not.toContain('someone');
  });

  test('shows the pending activation notice with a way to get a new link', async ({ page }) => {
    await page.goto('/activation');

    await expect(heading(page, 'Confirm your e-mail address')).toBeVisible();
    await expect(main(page)).toContainText('sign in to send a new link');
    await expect(main(page).getByRole('link', { name: 'Sign in' })).toHaveAttribute('href', '/login');
  });
});

/* The Python backend's e-mails link to these paths (rotkehlchen-web templates and portal_url). Their
   shape must not change: already-sent e-mails keep pointing at them. */
test.describe('links sent by e-mail', () => {
  test('password reset link opens the new password form and submits it', async ({ page }) => {
    let confirmBody: Record<string, unknown> | undefined;
    await page.route('**/webapi/password-reset/validate/', async route => route.fulfill({ json: {} }));
    await page.route('**/webapi/password-reset/confirm/', async (route) => {
      confirmBody = route.request().postDataJSON();
      await route.fulfill({ json: {} });
    });
    await page.goto('/password/reset/MQ/abc-123');

    await expect(heading(page, 'Set a new password')).toBeVisible();
    await expect(page.locator('input#password').first()).toHaveAttribute('autocomplete', 'new-password');
    await page.locator('input#password').first().fill('n3wP4ssword');
    await page.locator('input#password-confirmation').first().fill('n3wP4ssword');
    await page.locator('input#password-confirmation').first().press('Enter');

    await page.waitForURL('**/password/changed');
    await expect(heading(page, 'Password changed')).toBeVisible();
    await expect(main(page).getByRole('link', { name: 'Sign in' })).toHaveAttribute('href', '/login');
    expect(confirmBody).toMatchObject({ uid: 'MQ', token: 'abc-123', password: 'n3wP4ssword' });
  });

  test('expired password reset link offers a new one', async ({ page }) => {
    await page.route('**/webapi/password-reset/validate/', async route => route.fulfill({ status: 404, json: {} }));
    await page.goto('/password/reset/MQ/expired');

    await expect(heading(page, 'This reset link is not valid')).toBeVisible();
    await expect(main(page).getByRole('link', { name: 'Request a new link' })).toHaveAttribute('href', '/password/recover');
  });

  test('activation link with a trailing slash activates the account', async ({ page }) => {
    let activated = '';
    await page.route('**/webapi/activate/**', async (route) => {
      activated = new URL(route.request().url()).pathname;
      await route.fulfill({ json: { result: true } });
    });
    await page.route('**/webapi/account/', async route => route.fulfill({ json: { result: defaultAccount() } }));
    await page.goto('/activate/MQ/abc-123/');

    await expect(heading(page, 'Welcome to rotki')).toBeVisible();
    await expect(main(page).getByRole('link', { name: 'Go to your account' })).toHaveAttribute('href', '/home/subscription');
    expect(activated).toBe('/webapi/activate/MQ/abc-123/');
  });

  test('invalid activation link points to sign in', async ({ page }) => {
    await page.route('**/webapi/activate/**', async route => route.fulfill({ status: 404, json: {} }));
    await page.goto('/activate/MQ/used-token/');

    await expect(heading(page, 'This activation link is not valid')).toBeVisible();
    await expect(main(page).getByRole('link', { name: 'Sign in' })).toHaveAttribute('href', '/login');
  });

  for (const [path, landing] of [
    ['/home', '/home/subscription'],
    ['/home/saved-cards', '/home/saved-cards'],
    ['/home/payment-methods', '/home/saved-cards'],
  ] as const) {
    test(`${path} asks a signed-out visitor to sign in`, async ({ page }) => {
      await page.goto(path);

      await page.waitForURL('**/login**');
      await expect(heading(page, 'Sign in')).toBeVisible();
      expect(new URL(page.url()).searchParams.get('redirectUrl')).toContain(landing);
    });
  }
});
