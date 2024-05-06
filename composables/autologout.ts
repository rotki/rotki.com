import { storeToRefs } from 'pinia';
import { useLogger } from '~/utils/use-logger';
import { useMainStore } from '~/store';

export function useAutoLogout() {
  const store = useMainStore();
  const { authenticated } = storeToRefs(store);

  const logger = useLogger('auto-logout');

  watch(authenticated, async (authenticated) => {
    if (!authenticated) {
      logger.debug('authentication lost, redirecting to login');
      await navigateTo('/login');
    }
  });
}
