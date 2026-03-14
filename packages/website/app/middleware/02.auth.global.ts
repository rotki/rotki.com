import { defineNuxtRouteMiddleware, navigateTo } from '#imports';
import { get } from '@vueuse/shared';
import { storeToRefs } from 'pinia';
import { useAuthHintCookie } from '~/composables/use-fetch-with-csrf';
import { useMainStore } from '~/store';
import {
  type AuthGuardActions,
  type AuthState,
  ensureAuthenticated,
  ensureCanBuy,
  ensureVerified,
  handleGuestOnly,
  type NavigationResult,
} from '~/utils/auth-guards';

function applyResult(result: NavigationResult): ReturnType<typeof navigateTo> | undefined {
  if ('redirect' in result)
    return navigateTo(result.redirect);
}

export default defineNuxtRouteMiddleware(async (to) => {
  const { auth, guestOnly, requiresSubscriber, requiresVerified } = to.meta;

  if (!auth && !guestOnly)
    return;

  const store = useMainStore();
  const { account, authenticated, canBuy } = storeToRefs(store);
  const authHint = useAuthHintCookie();

  function getState(): AuthState {
    return {
      authenticated: get(authenticated),
      authHint: get(authHint) ?? undefined,
      canBuy: get(canBuy),
      emailConfirmed: get(account)?.emailConfirmed,
    };
  }

  const actions: AuthGuardActions = {
    getAccount: store.getAccount,
  };

  if (guestOnly) {
    const result = await handleGuestOnly(getState, actions);
    return applyResult(result);
  }

  if (auth) {
    const result = await ensureAuthenticated(getState, actions, to);
    if ('redirect' in result)
      return applyResult(result);
  }

  if (requiresVerified) {
    const result = ensureVerified(getState);
    if ('redirect' in result)
      return applyResult(result);
  }

  if (requiresSubscriber) {
    const upgradeSubId = typeof to.query.upgradeSubId === 'string' ? to.query.upgradeSubId : undefined;
    const result = await ensureCanBuy(getState, actions, upgradeSubId);
    if ('redirect' in result)
      return applyResult(result);
  }
});
