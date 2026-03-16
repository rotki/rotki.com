import { defineNuxtRouteMiddleware, navigateTo } from '#imports';
import { get } from '@vueuse/shared';
import { useAppConfig } from '~/composables/use-app-config';

export default defineNuxtRouteMiddleware(async (to) => {
  if (to.path === '/maintenance' || to.path === '/health')
    return;

  // Only block routes that depend on the backend (/webapi)
  const { auth, backendRequired, guestOnly } = to.meta;
  if (!auth && !guestOnly && !backendRequired)
    return;

  const { isMaintenance } = useAppConfig();
  if (get(isMaintenance))
    return navigateTo('/maintenance');
});
