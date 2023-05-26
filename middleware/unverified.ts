import { get } from '@vueuse/core';
import { storeToRefs } from 'pinia';
import { useMainStore } from '~/store';

export default defineNuxtRouteMiddleware(() => {
  const { account } = storeToRefs(useMainStore());

  if (!isDefined(account)) {
    return;
  }

  const { emailConfirmed } = get(account);
  if (!emailConfirmed) {
    return navigateTo('/home');
  }
});
