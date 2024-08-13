import { storeToRefs } from 'pinia';
import { get } from '@vueuse/core';
import { useMainStore } from '~/store';

export default defineNuxtRouteMiddleware(async () => {
  const { authenticated } = storeToRefs(useMainStore());
  if (!get(authenticated))
    return navigateTo('/login');
});
