import { defineNuxtRouteMiddleware, navigateTo, useRuntimeConfig } from '#imports';

export default defineNuxtRouteMiddleware(async (to) => {
  if (to.path === '/maintenance' || to.path === '/health')
    return;

  // Only block routes that depend on the backend (/webapi)
  const { auth, backendRequired, guestOnly } = to.meta;
  if (!auth && !guestOnly && !backendRequired)
    return;

  const config = useRuntimeConfig();
  if (config.public.maintenance)
    return navigateTo('/maintenance');
});
