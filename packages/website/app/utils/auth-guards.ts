import type { RouteLocationNormalized } from 'vue-router';

export interface AuthState {
  authenticated: boolean;
  authHint: string | undefined;
  emailConfirmed: boolean | undefined;
  canBuy: boolean;
}

export type StateGetter = () => AuthState;

export interface AuthGuardActions {
  getAccount: () => Promise<void>;
}

export type NavigationResult =
  | { redirect: string | { path: string; query: Record<string, any> } }
  | { allow: true };

const SUBSCRIPTION_PATH = '/home/subscription';
const LOGIN_PATH = '/login';

/**
 * Handles guestOnly routes (e.g., /login).
 * Redirects authenticated users to subscription page.
 */
export async function handleGuestOnly(
  getState: StateGetter,
  actions: AuthGuardActions,
): Promise<NavigationResult> {
  const state = getState();
  if (!state.authenticated && state.authHint) {
    try {
      await actions.getAccount();
    }
    catch {
      return { allow: true };
    }
  }

  if (getState().authenticated)
    return { redirect: SUBSCRIPTION_PATH };

  return { allow: true };
}

/**
 * Ensures the user is authenticated.
 * Attempts auth_hint recovery if not authenticated.
 * Redirects to login with redirectUrl on failure.
 */
export async function ensureAuthenticated(
  getState: StateGetter,
  actions: AuthGuardActions,
  to: Pick<RouteLocationNormalized, 'query' | 'fullPath'>,
): Promise<NavigationResult> {
  if (getState().authenticated)
    return { allow: true };

  if (getState().authHint) {
    try {
      await actions.getAccount();
    }
    catch {
      // getAccount failed — redirect to login
    }
  }

  if (getState().authenticated)
    return { allow: true };

  return {
    redirect: {
      path: LOGIN_PATH,
      query: {
        ...to.query,
        redirectUrl: to.fullPath,
      },
    },
  };
}

/**
 * Ensures the user's email is confirmed.
 * Redirects unverified users to subscription page.
 */
export function ensureVerified(getState: StateGetter): NavigationResult {
  if (getState().emailConfirmed === false)
    return { redirect: SUBSCRIPTION_PATH };

  return { allow: true };
}

/**
 * Ensures the user can purchase (canBuy) or has an upgradeSubId bypass.
 */
export async function ensureCanBuy(
  getState: StateGetter,
  actions: AuthGuardActions,
  upgradeSubId: string | undefined,
): Promise<NavigationResult> {
  if (!getState().authenticated) {
    try {
      await actions.getAccount();
    }
    catch {
      // fall through to check
    }
  }

  if (!getState().canBuy && !upgradeSubId)
    return { redirect: SUBSCRIPTION_PATH };

  return { allow: true };
}
