import { defineNuxtRouteMiddleware, navigateTo, useRuntimeConfig } from '#imports';

export default defineNuxtRouteMiddleware(async () => {
  const config = useRuntimeConfig();
  if (config.public.maintenance)
    return navigateTo('/maintenance');
});
