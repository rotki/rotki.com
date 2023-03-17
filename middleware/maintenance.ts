export default defineNuxtRouteMiddleware(() => {
  const config = useRuntimeConfig();
  if (config.public.maintenance) {
    return navigateTo('/maintenance');
  }
});
