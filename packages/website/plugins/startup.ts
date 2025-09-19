import { get } from '@vueuse/core';
import { useSessionIdCookie } from '~/composables/use-fetch-with-csrf';
import { useMainStore } from '~/store';

export default defineNuxtPlugin(async () => {
  const { name } = useRoute();
  const logger = useLogger('startup');
  if (name === 'health')
    return;

  const sessionId = useSessionIdCookie();
  const session = get(sessionId);

  if (session) {
    logger.debug(`fetching account for session id: ${session}`);
    const { getAccount } = useMainStore();
    return getAccount();
  }
});
