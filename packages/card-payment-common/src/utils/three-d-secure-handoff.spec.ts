import { afterEach, describe, expect, it } from 'vitest';
import { THREE_D_SECURE_SESSION_KEY, type ThreeDSecureParams } from '../schemas/three-d-secure';
import { clearThreeDSecureHandoff, readThreeDSecureHandoff, saveThreeDSecureHandoff } from './three-d-secure-handoff';

const params: ThreeDSecureParams = {
  amount: '25.00',
  bin: '411111',
  durationInMonths: 1,
  finalAmount: '22.50',
  nonce: 'card-nonce',
  planId: 3,
  planName: 'basic',
  renewingPrice: '25.00',
  token: 'client-token',
};

describe('three-d-secure handoff', () => {
  afterEach(() => {
    sessionStorage.clear();
  });

  it('reads back what the card page saved', () => {
    saveThreeDSecureHandoff(params);

    expect(readThreeDSecureHandoff()).toEqual({ params });
  });

  it('says when there is nothing to read', () => {
    expect(readThreeDSecureHandoff()).toEqual({ problem: 'missing' });
  });

  it.each([
    ['broken JSON', '{'],
    ['data that is not a handoff', JSON.stringify({ ...params, planId: -1 })],
  ])('drops %s', (_, stored) => {
    sessionStorage.setItem(THREE_D_SECURE_SESSION_KEY, stored);

    expect(readThreeDSecureHandoff()).toMatchObject({ problem: 'invalid' });
    expect(sessionStorage.getItem(THREE_D_SECURE_SESSION_KEY)).toBeNull();
  });

  it('clears the handoff', () => {
    saveThreeDSecureHandoff(params);
    clearThreeDSecureHandoff();

    expect(readThreeDSecureHandoff()).toEqual({ problem: 'missing' });
  });
});
