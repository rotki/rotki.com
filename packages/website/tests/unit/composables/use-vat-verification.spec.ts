import { mountSuspended } from '@nuxt/test-utils/runtime';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { defineComponent, h, nextTick } from 'vue';
import { useVatVerification } from '~/composables/account/use-vat-verification';

const { checkVAT, refreshVATCheckStatus } = vi.hoisted(() => ({
  checkVAT: vi.fn(),
  refreshVATCheckStatus: vi.fn(),
}));

vi.mock('~/modules/checkout/composables/use-vat-check', () => ({
  useVatCheck: () => ({ checkVAT, refreshVATCheckStatus }),
}));

type Verification = ReturnType<typeof useVatVerification>;

/** The hook reads i18n and the store, so it has to run inside a component. */
async function setup(save: () => Promise<boolean>): Promise<Verification> {
  let result: Verification | undefined;
  await mountSuspended(defineComponent({
    setup() {
      result = useVatVerification(save);
      return () => h('div');
    },
  }));
  return result!;
}

describe('useVatVerification', () => {
  beforeEach(() => {
    localStorage.clear();
    checkVAT.mockReset();
    refreshVATCheckStatus.mockReset().mockResolvedValue(undefined);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('does not ask the backend when the save failed', async () => {
    const { checking, verify } = await setup(async () => false);

    await verify();

    expect(checkVAT).not.toHaveBeenCalled();
    expect(checking.value).toBe(false);
  });

  it('shows the error the backend gives, then clears it', async () => {
    vi.useFakeTimers();
    checkVAT.mockResolvedValue({ message: 'The VAT service is down', success: false });
    const { errorMessage, verify } = await setup(async () => true);

    await verify();
    expect(errorMessage.value).toBe('The VAT service is down');

    vi.advanceTimersByTime(3000);
    expect(errorMessage.value).toBe('');
  });

  it('counts down the wait the backend asks for and keeps it in local storage', async () => {
    vi.useFakeTimers();
    checkVAT.mockResolvedValue({ seconds: 90 });
    const { remainingTime, verify } = await setup(async () => true);

    await verify();
    expect(remainingTime.value).toBe(90);
    expect(Number(localStorage.getItem('rotki.vat_check.wait_until_time'))).toBeGreaterThan(Date.now() / 1000);

    vi.advanceTimersByTime(30_000);
    await nextTick();
    expect(remainingTime.value).toBe(60);

    vi.advanceTimersByTime(60_000);
    await nextTick();
    expect(remainingTime.value).toBe(0);
  });
});
