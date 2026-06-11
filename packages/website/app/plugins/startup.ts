import { setSigilDebug } from '@rotki/sigil';
import { get } from '@vueuse/shared';
import { useReferralTracking } from '~/composables/chronicling/use-referral-tracking';
import { useUtmTracking } from '~/composables/chronicling/use-utm-tracking';
import { useAuthHintCookie } from '~/composables/use-fetch-with-csrf';
import { useMainStore } from '~/store';
import { useLogger } from '~/utils/use-logger';

export default defineNuxtPlugin(async () => {
  const { name } = useRoute();
  const logger = useLogger('startup');
  if (name === 'health')
    return;

  // Capture UTM params on first visit (client-side only)
  if (import.meta.client) {
    const { sigilDebug } = useRuntimeConfig().public;
    if (sigilDebug) {
      setSigilDebug(true);
    }

    const { captureUtmParams } = useUtmTracking();
    captureUtmParams();

    const { captureReferralCode } = useReferralTracking();
    captureReferralCode();
  }

  // Account recovery is a client-only concern. Landing pages are statically
  // prerendered with no user context and every auth-gated route is `ssr: false`,
  // so fetching the account during SSR gains us nothing. It is also unsafe: in a
  // Nuxt-only dev server (`make dev-web`) `/webapi` has no proxy, so a server-side
  // request to `/webapi/account/` falls through to the SPA renderer, which re-runs
  // this plugin and recurses until the render worker runs out of memory. Guarding
  // to the client both avoids that loop and matches where auth state actually lives.
  if (import.meta.client) {
    const authHint = useAuthHintCookie();
    if (get(authHint)) {
      logger.debug('auth hint found, fetching account');
      const { getAccount } = useMainStore();
      await getAccount();
    }
  }
});
