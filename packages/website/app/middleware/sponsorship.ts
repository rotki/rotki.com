import { get } from '@vueuse/shared';

export default defineNuxtRouteMiddleware((to) => {
  const { isEnabled } = useSponsorshipFeature();

  const isSponsorRoute = to.path.startsWith('/sponsor');

  if (isSponsorRoute && !get(isEnabled)) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Page not found',
    });
  }
});
