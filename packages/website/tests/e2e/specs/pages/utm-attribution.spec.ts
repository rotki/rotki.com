import { expect, type Page } from '@playwright/test';
import { parseTrackingSessionCookie, type TrackingSession, UTM_COOKIE_MAX_AGE_SECONDS, UTM_COOKIE_NAME } from '@rotki/sigil';
import { test } from '../../support/fixtures';
import { waitForHydration } from '../../support/hydration';

async function open(page: Page, path: string): Promise<void> {
  await page.goto(path);
  await waitForHydration(page);
}

/** The session as the card payment page reads it, which also proves it can parse what Nuxt writes. */
async function storedSession(page: Page): Promise<TrackingSession | undefined> {
  return parseTrackingSessionCookie(await page.evaluate(() => document.cookie));
}

async function sessionWithSource(page: Page, source: string): Promise<TrackingSession> {
  await expect.poll(async () => (await storedSession(page))?.utm.utmSource).toBe(source);
  const session = await storedSession(page);
  if (!session)
    throw new Error('Expected a tracking session');
  return session;
}

test.describe('utm attribution', () => {
  test('credits a source that arrives after an untagged visit', async ({ page }) => {
    await open(page, '/');
    await expect.poll(async () => storedSession(page)).toBeDefined();
    const untagged = await storedSession(page);
    expect(untagged?.utm.utmSource).toBeUndefined();

    await open(page, '/?utm_source=newsletter&utm_campaign=autumn');
    const tagged = await sessionWithSource(page, 'newsletter');

    expect(tagged.sessionId).toBe(untagged?.sessionId);
    expect(tagged.utm.utmCampaign).toBe('autumn');
    expect(tagged.utm.landingPath).toBe('/?utm_source=newsletter&utm_campaign=autumn');
  });

  test('restarts the 30-day window when a source is stored', async ({ page, context, baseURL }) => {
    const oneDay = 60 * 60 * 24;
    const untagged: TrackingSession = { sessionId: 'sess-old', utm: { landingPath: '/' } };
    await context.addCookies([{
      name: UTM_COOKIE_NAME,
      value: encodeURIComponent(JSON.stringify(untagged)),
      url: baseURL,
      expires: Date.now() / 1000 + oneDay,
    }]);

    await open(page, '/?utm_source=newsletter');
    const session = await sessionWithSource(page, 'newsletter');
    const expiry = (await context.cookies()).find(cookie => cookie.name === UTM_COOKIE_NAME)?.expires ?? 0;

    expect(session.sessionId).toBe('sess-old');
    expect(expiry).toBeGreaterThan(Date.now() / 1000 + UTM_COOKIE_MAX_AGE_SECONDS - 60);
  });

  test('keeps the first source', async ({ page }) => {
    await open(page, '/?utm_source=newsletter');
    await sessionWithSource(page, 'newsletter');

    await open(page, '/?utm_source=twitter');
    await open(page, '/');
    const session = await sessionWithSource(page, 'newsletter');
    expect(session.utm.landingPath).toBe('/?utm_source=newsletter');
  });

  test('does not count a link without a source', async ({ page }) => {
    await open(page, '/?utm_campaign=autumn');
    await expect.poll(async () => storedSession(page)).toBeDefined();

    expect((await storedSession(page))?.utm.utmCampaign).toBeUndefined();

    await open(page, '/?utm_source=newsletter');
    await sessionWithSource(page, 'newsletter');
  });
});
