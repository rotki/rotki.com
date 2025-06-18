import { get } from '@vueuse/core';
import { useSessionIdCookie } from '~/composables/use-fetch-with-csrf';
import { useMainStore } from '~/store';

export default defineNuxtPlugin(async () => {
  const { name } = useRoute();
  if (name === 'health')
    return;

  const sessionId = useSessionIdCookie();

  if (get(sessionId)) {
    const { refreshUserData } = useMainStore();
    return refreshUserData();
  }
});
