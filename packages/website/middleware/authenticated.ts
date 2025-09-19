import { storeToRefs } from 'pinia';
import { useMainStore } from '~/store';

export default defineNuxtRouteMiddleware(async () => {
  const { account } = storeToRefs(useMainStore());

  if (isDefined(account))
    return navigateTo('/home/subscription');
});
