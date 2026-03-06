import { defineNuxtRouteMiddleware, navigateTo } from '#imports';
import { get } from '@vueuse/core';
import { storeToRefs } from 'pinia';
import { useMainStore } from '~/store';

export default defineNuxtRouteMiddleware(async (to) => {
  const { authenticated } = storeToRefs(useMainStore());
  if (!get(authenticated)) {
    return navigateTo({
      path: '/login',
      query: {
        ...to.query,
        redirectUrl: to.fullPath,
      },
    });
  }
});
