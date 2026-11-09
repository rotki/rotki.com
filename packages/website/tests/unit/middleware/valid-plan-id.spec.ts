import type { RouteLocationNormalized } from 'vue-router';
import { mockNuxtImport } from '@nuxt/test-utils/runtime';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { computed, ref } from 'vue';
import validPlanId from '~/middleware/valid-plan-id';

const { navigateToMock, plans, execute } = vi.hoisted(() => {
  const plans: { ids: number[]; live: number[] } = { ids: [], live: [] };
  return { navigateToMock: vi.fn(), plans, execute: vi.fn() };
});

mockNuxtImport('navigateTo', () => navigateToMock);

vi.mock('~/composables/tiers/use-available-plans', () => ({
  useAvailablePlans: () => {
    const ids = ref<number[]>(plans.ids);
    execute.mockImplementation(async () => {
      ids.value = plans.live;
    });
    return {
      availablePlans: computed(() => ids.value.map(planId => ({ monthlyPlan: { planId } }))),
      execute,
    };
  },
}));

function routeTo(planId?: string): RouteLocationNormalized {
  return { fullPath: '/', hash: '', matched: [], meta: {}, name: undefined, params: {}, path: '/', query: planId ? { planId } : {}, redirectedFrom: undefined };
}

describe('middleware/valid-plan-id', () => {
  beforeEach(() => {
    navigateToMock.mockReset();
    execute.mockReset();
    plans.ids = [1, 3];
    plans.live = [3, 5];
  });

  it('lets a plan in the snapshot through without waiting for the live plans', async () => {
    await validPlanId(routeTo('3'), routeTo());

    expect(execute).not.toHaveBeenCalled();
    expect(navigateToMock).not.toHaveBeenCalled();
  });

  it('asks the live plans about a plan the snapshot does not know', async () => {
    await validPlanId(routeTo('5'), routeTo());

    expect(execute).toHaveBeenCalledOnce();
    expect(navigateToMock).not.toHaveBeenCalled();
  });

  it('sends a plan neither of them knows to the plans page', async () => {
    await validPlanId(routeTo('99'), routeTo());

    expect(execute).toHaveBeenCalledOnce();
    expect(navigateToMock).toHaveBeenCalledWith({ name: 'checkout-pay', query: {} });
  });

  it('sends a missing plan to the plans page', async () => {
    await validPlanId(routeTo(), routeTo());

    expect(navigateToMock).toHaveBeenCalledOnce();
  });
});
