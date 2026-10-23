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

  /* Account recovery is client-only: prerendered pages have no user context and
     auth-gated routes are `ssr: false`. In a Nuxt-only dev server (`make dev-web`)
     `/webapi` has no proxy, so an SSR fetch of `/webapi/account/` hits the SPA
     renderer, which re-runs this plugin until the worker runs out of memory. */
  if (import.meta.client) {
    const { getAccount } = useMainStore();

    const authHint = useAuthHintCookie();
    if (get(authHint)) {
      logger.debug('auth hint found, fetching account');
      await getAccount();
    }
  }
});
