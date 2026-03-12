import { describe, expect, it, vi } from 'vitest';
import {
  type AuthGuardActions,
  type AuthState,
  ensureAuthenticated,
  ensureCanBuy,
  ensureVerified,
  handleGuestOnly,
  type StateGetter,
} from '~/utils/auth-guards';

function createState(overrides: Partial<AuthState> = {}): AuthState {
  return {
    authenticated: false,
    authHint: undefined,
    canBuy: true,
    emailConfirmed: undefined,
    ...overrides,
  };
}

function createActions(overrides: Partial<AuthGuardActions> = {}): AuthGuardActions {
  return {
    getAccount: vi.fn(),
    ...overrides,
  };
}

function createStateGetter(initial: AuthState, postGetAccount?: Partial<AuthState>): { getState: StateGetter; actions: AuthGuardActions } {
  let state = initial;
  const getAccount = vi.fn(async () => {
    if (postGetAccount)
      state = { ...state, ...postGetAccount };
  });
  return {
    actions: { getAccount },
    getState: () => state,
  };
}

describe('handleGuestOnly', () => {
  it('should allow unauthenticated users without hint', async () => {
    const { actions, getState } = createStateGetter(createState());

    const result = await handleGuestOnly(getState, actions);

    expect(result).toEqual({ allow: true });
    expect(actions.getAccount).not.toHaveBeenCalled();
  });

  it('should redirect authenticated users', async () => {
    const { actions, getState } = createStateGetter(createState({ authenticated: true }));

    const result = await handleGuestOnly(getState, actions);

    expect(result).toEqual({ redirect: '/home/subscription' });
  });

  it('should attempt getAccount when hint exists and not authenticated', async () => {
    const { actions, getState } = createStateGetter(
      createState({ authHint: '1' }),
      { authenticated: true },
    );

    const result = await handleGuestOnly(getState, actions);

    expect(actions.getAccount).toHaveBeenCalledOnce();
    expect(result).toEqual({ redirect: '/home/subscription' });
  });

  it('should allow when hint exists but getAccount fails', async () => {
    const actions = createActions({
      getAccount: vi.fn().mockRejectedValue(new Error('unauthorized')),
    });
    const getState = () => createState({ authHint: '1' });

    const result = await handleGuestOnly(getState, actions);

    expect(result).toEqual({ allow: true });
  });

  it('should allow when hint exists but getAccount does not authenticate', async () => {
    const { actions, getState } = createStateGetter(
      createState({ authHint: '1' }),
      { authenticated: false },
    );

    const result = await handleGuestOnly(getState, actions);

    expect(actions.getAccount).toHaveBeenCalledOnce();
    expect(result).toEqual({ allow: true });
  });
});

describe('ensureAuthenticated', () => {
  const route = { fullPath: '/home/subscription', query: {} };

  it('should allow already authenticated users', async () => {
    const { actions, getState } = createStateGetter(createState({ authenticated: true }));

    const result = await ensureAuthenticated(getState, actions, route);

    expect(result).toEqual({ allow: true });
    expect(actions.getAccount).not.toHaveBeenCalled();
  });

  it('should redirect unauthenticated users without hint', async () => {
    const { actions, getState } = createStateGetter(createState());

    const result = await ensureAuthenticated(getState, actions, route);

    expect(result).toEqual({
      redirect: {
        path: '/login',
        query: { redirectUrl: '/home/subscription' },
      },
    });
  });

  it('should attempt recovery via auth hint', async () => {
    const { actions, getState } = createStateGetter(
      createState({ authHint: '1' }),
      { authenticated: true },
    );

    const result = await ensureAuthenticated(getState, actions, route);

    expect(actions.getAccount).toHaveBeenCalledOnce();
    expect(result).toEqual({ allow: true });
  });

  it('should redirect when hint recovery fails', async () => {
    const actions = createActions({
      getAccount: vi.fn().mockRejectedValue(new Error('unauthorized')),
    });
    const getState = () => createState({ authHint: '1' });

    const result = await ensureAuthenticated(getState, actions, route);

    expect(result).toEqual({
      redirect: {
        path: '/login',
        query: { redirectUrl: '/home/subscription' },
      },
    });
  });

  it('should preserve existing query params in redirect', async () => {
    const routeWithQuery = { fullPath: '/checkout/pay/method?planId=1', query: { planId: '1' } };
    const { actions, getState } = createStateGetter(createState());

    const result = await ensureAuthenticated(getState, actions, routeWithQuery);

    expect(result).toEqual({
      redirect: {
        path: '/login',
        query: {
          planId: '1',
          redirectUrl: '/checkout/pay/method?planId=1',
        },
      },
    });
  });
});

describe('ensureVerified', () => {
  it('should allow when email is confirmed', () => {
    const getState = () => createState({ emailConfirmed: true });

    const result = ensureVerified(getState);

    expect(result).toEqual({ allow: true });
  });

  it('should redirect when email is not confirmed', () => {
    const getState = () => createState({ emailConfirmed: false });

    const result = ensureVerified(getState);

    expect(result).toEqual({ redirect: '/home/subscription' });
  });

  it('should allow when emailConfirmed is undefined (no account loaded)', () => {
    const getState = () => createState({ emailConfirmed: undefined });

    const result = ensureVerified(getState);

    expect(result).toEqual({ allow: true });
  });
});

describe('ensureCanBuy', () => {
  it('should allow when canBuy is true', async () => {
    const { actions, getState } = createStateGetter(createState({ authenticated: true, canBuy: true }));

    const result = await ensureCanBuy(getState, actions, undefined);

    expect(result).toEqual({ allow: true });
  });

  it('should redirect when canBuy is false and no upgradeSubId', async () => {
    const { actions, getState } = createStateGetter(createState({ authenticated: true, canBuy: false }));

    const result = await ensureCanBuy(getState, actions, undefined);

    expect(result).toEqual({ redirect: '/home/subscription' });
  });

  it('should allow when canBuy is false but upgradeSubId is present', async () => {
    const { actions, getState } = createStateGetter(createState({ authenticated: true, canBuy: false }));

    const result = await ensureCanBuy(getState, actions, 'sub-123');

    expect(result).toEqual({ allow: true });
  });

  it('should attempt getAccount when not authenticated', async () => {
    const { actions, getState } = createStateGetter(
      createState({ canBuy: false }),
      { authenticated: true },
    );

    const result = await ensureCanBuy(getState, actions, undefined);

    expect(actions.getAccount).toHaveBeenCalledOnce();
    expect(result).toEqual({ redirect: '/home/subscription' });
  });

  it('should handle getAccount failure gracefully', async () => {
    const actions = createActions({
      getAccount: vi.fn().mockRejectedValue(new Error('failed')),
    });
    const getState = () => createState({ canBuy: false });

    const result = await ensureCanBuy(getState, actions, undefined);

    expect(result).toEqual({ redirect: '/home/subscription' });
  });
});
