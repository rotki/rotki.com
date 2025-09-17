import { defineNuxtRouteMiddleware, navigateTo } from '#imports';
import { get } from '@vueuse/core';
import { isDefined } from '@vueuse/shared';
import { storeToRefs } from 'pinia';
import { useMainStore } from '~/store';

export default defineNuxtRouteMiddleware(async () => {
  const { account } = storeToRefs(useMainStore());

  if (!isDefined(account))
    return;

  const { emailConfirmed } = get(account);
  if (!emailConfirmed)
    return navigateTo('/home/subscription');
});
