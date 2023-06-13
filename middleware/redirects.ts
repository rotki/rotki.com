import { get } from '@vueuse/core';

export default defineNuxtRouteMiddleware(async (to) => {
  if (to.name === 'jobs') {
    const { loadJobs, firstJob } = useMarkdownContent();
    await loadJobs();
    if (get(firstJob)) {
      return navigateTo(get(firstJob)?.link);
    }
  }
});
