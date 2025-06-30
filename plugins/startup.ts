import { useMainStore } from '~/store';
import { SESSION_COOKIE } from '~/utils/api';

export default defineNuxtPlugin(async () => {
  const { name } = useRoute();
  if (name === 'health')
    return;

  const sessionId = useCookie(SESSION_COOKIE).value;

  if (sessionId) {
    const { refreshUserData } = useMainStore();

    return refreshUserData();
  }
});
