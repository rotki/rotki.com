import { get } from '@vueuse/shared';
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
    const { captureUtmParams } = useUtmTracking();
    captureUtmParams();
  }

  const authHint = useAuthHintCookie();
  const hint = get(authHint);

  if (hint) {
    logger.debug('auth hint found, fetching account');
    const { getAccount } = useMainStore();
    return getAccount();
  }
});
