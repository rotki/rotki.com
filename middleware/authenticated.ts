import { storeToRefs } from 'pinia';
import { useMainStore } from '~/store';

export default defineNuxtRouteMiddleware(() => {
  const { account } = storeToRefs(useMainStore());

  if (isDefined(account)) {
    return navigateTo('/home/subscription');
  }
});
