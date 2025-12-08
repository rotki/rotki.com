import { storeToRefs } from 'pinia';
import { useMainStore } from '~/store';
import { useLogger } from '~/utils/use-logger';

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
