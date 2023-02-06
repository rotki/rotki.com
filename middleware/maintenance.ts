export default defineNuxtRouteMiddleware(() => {
  const config = useRuntimeConfig()
  if (config.public.maintenance !== 'false') {
    return navigateTo('/maintenance')
  }
})
