import { expect, test } from '@playwright/test';

const mockAvailableTiers = {
  settings: {
    is_authenticated: false,
    country: null,
  },
  tiers: [
    { tier_name: 'Free', monthly_plan: null, yearly_plan: null },
    { tier_name: 'Basic', monthly_plan: { plan_id: 3, price: '25.00' }, yearly_plan: { plan_id: 4, price: '250.00' } },
    { tier_name: 'Advanced', monthly_plan: { plan_id: 1, price: '45.00' }, yearly_plan: { plan_id: 2, price: '450.00' } },
  ],
};

const mockAuthenticatedAccount = {
  result: {
    username: 'testuser',
    email: 'test@example.com',
    email_confirmed: true,
    has_active_subscription: false,
    can_use_premium: false,
    api_key: '',
    api_secret: '',
    date_now: new Date().toISOString(),
    vat: 0,
    vat_id_status: 'Not checked',
    address: {
      address1: '',
      address2: '',
      city: '',
      company_name: '',
      country: '',
      first_name: 'Test',
      last_name: 'User',
      moved_offline: false,
      postcode: '',
      vat_id: '',
    },
  },
};

const REDIRECT_STORAGE_KEY = 'rotki.redirect_url';

function randomPlanId(): number {
  return Math.floor(Math.random() * 9) + 1;
}

async function setupUnauthenticatedMocks(page: import('@playwright/test').Page): Promise<void> {
  await page.route('**/webapi/2/available-tiers', async route => route.fulfill({ json: mockAvailableTiers }));
  await page.route('**/webapi/csrf/**', async route => route.fulfill({ json: { detail: 'CSRF cookie set' } }));
  await page.route('**/webapi/account/', async route => route.fulfill({ status: 401, json: { message: 'Not authenticated' } }));
}

test.describe('payment redirect after signup', () => {
  test('unauthenticated user on checkout method page is redirected to login with redirectUrl', async ({ page }) => {
    const planId = randomPlanId();
    await setupUnauthenticatedMocks(page);
    await page.goto(`/checkout/pay/method?planId=${planId}`);
    await page.waitForURL('**/login**');

    const url = new URL(page.url());
    const redirectUrl = url.searchParams.get('redirectUrl');
    expect(redirectUrl).toBeTruthy();
    expect(redirectUrl).toContain('/checkout/pay/method');
    expect(redirectUrl).toContain(`planId=${planId}`);
  });

  test('login page passes redirectUrl to signup link', async ({ page }) => {
    const planId = randomPlanId();
    await setupUnauthenticatedMocks(page);
    const paymentPath = `/checkout/pay/method?planId=${planId}`;
    await page.goto(`/login?redirectUrl=${encodeURIComponent(paymentPath)}`);
    await page.waitForLoadState('networkidle');

    const signupLink = page.getByRole('link', { name: /sign up/i });
    await expect(signupLink).toBeVisible();

    const href = await signupLink.getAttribute('href');
    expect(href).toContain('/signup');
    expect(href).toContain('redirectUrl');
    expect(decodeURIComponent(href ?? '')).toContain(`planId=${planId}`);
  });

  test('signup page preserves redirectUrl through form steps', async ({ page }) => {
    const planId = randomPlanId();
    await setupUnauthenticatedMocks(page);

    await page.route('**/webapi/countries/', async (route) => {
      await route.fulfill({
        status: 200,
        json: { result: [{ code: 'DE', name: 'Germany' }] },
      });
    });

    const paymentPath = `/checkout/pay/card?planId=${planId}`;
    await page.goto(`/signup?redirectUrl=${encodeURIComponent(paymentPath)}`);
    await page.waitForLoadState('networkidle');

    // Step 1: Introduction — click Next
    await page.locator('[data-cy=next-button]').click();
    expect(new URL(page.url()).searchParams.get('redirectUrl')).toBe(paymentPath);

    // Step 2: Account form — fill and advance
    await page.locator('input#username').first().fill('testuser');
    await page.locator('input#email').first().fill('test@example.com');
    await page.locator('input#password').first().fill('SecureP4ss!');
    await page.locator('input#password-confirmation').first().fill('SecureP4ss!');
    await page.locator('button[data-cy=next-button]').first().click();

    // Verify redirectUrl survives step navigation
    expect(new URL(page.url()).searchParams.get('redirectUrl')).toBe(paymentPath);
  });

  test('activation page shows payment continue button that navigates to checkout with planId', async ({ page }) => {
    const planId = randomPlanId();
    const paymentPath = `/checkout/pay/card?planId=${planId}`;

    // Mock activation and account API calls
    await page.route('**/webapi/activate/**', async route => route.fulfill({ json: { result: true } }));
    await page.route('**/webapi/account/', async route => route.fulfill({ json: mockAuthenticatedAccount }));
    await page.route('**/webapi/csrf/**', async route => route.fulfill({ json: { detail: 'CSRF cookie set' } }));

    // Seed localStorage before navigating to activation page
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    await page.evaluate(({ key, username, url }) => {
      localStorage.setItem(key, JSON.stringify({ username, url }));
    }, { key: REDIRECT_STORAGE_KEY, username: 'testuser', url: paymentPath });

    // Navigate to activation page
    await page.goto('/activate/test-uid/test-token');
    await page.waitForLoadState('networkidle');

    // Verify activation succeeded
    await expect(page.getByText('Welcome to rotki').first()).toBeVisible({ timeout: 10000 });

    // Verify payment continue section appears
    const paymentSection = page.getByText('Or continue your payment');
    await expect(paymentSection.first()).toBeVisible({ timeout: 10000 });

    const continueButton = paymentSection.locator('..').getByRole('button', { name: 'here' });
    await expect(continueButton).toBeVisible();

    // Click the button and verify it navigates to the correct checkout URL.
    // handlePaymentRedirect() uses window.location.href, so we capture the
    // outgoing page request to verify the target URL.
    const navigationTarget = page.waitForRequest(
      request => request.url().includes('/checkout/pay/card'),
      { timeout: 15000 },
    );

    await continueButton.click({ noWaitAfter: true });

    const request = await navigationTarget;
    const requestUrl = new URL(request.url());
    expect(requestUrl.pathname).toBe('/checkout/pay/card');
    expect(requestUrl.searchParams.get('planId')).toBe(String(planId));
  });
});
