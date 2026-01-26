import { get } from '@vueuse/core';
import { useUtmTracking } from '~/composables/chronicling/use-utm-tracking';
import { useSessionIdCookie } from '~/composables/use-fetch-with-csrf';
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

  const sessionId = useSessionIdCookie();
  const session = get(sessionId);

  if (session) {
    logger.debug(`fetching account for session id: ${session}`);
    const { getAccount } = useMainStore();
    return getAccount();
  }
});
