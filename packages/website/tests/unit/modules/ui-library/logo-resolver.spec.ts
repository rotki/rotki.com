import { describe, expect, it } from 'vitest';
import { createSeasonalLogoResolver } from '../../../../modules/ui-library/runtime/logo-resolver';

describe('modules/ui-library/runtime/logo-resolver', () => {
  it('resolves the website logo to the absolute same-origin endpoint', async () => {
    await expect(createSeasonalLogoResolver()('website')).resolves.toBe(`${window.location.origin}/api/logo/website`);
  });

  it('returns nothing for a logo the server does not serve', async () => {
    await expect(createSeasonalLogoResolver()('app')).resolves.toBeUndefined();
  });
});
