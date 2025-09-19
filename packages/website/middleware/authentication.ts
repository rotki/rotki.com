import { defineNuxtRouteMiddleware, navigateTo } from '#imports';
import { get } from '@vueuse/core';
import { storeToRefs } from 'pinia';
import { useMainStore } from '~/store';

export default defineNuxtRouteMiddleware(async () => {
  const { authenticated } = storeToRefs(useMainStore());
  if (!get(authenticated))
    return navigateTo('/login');
});
