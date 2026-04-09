import type { DeepReadonly, Ref } from 'vue';
import { get, set } from '@vueuse/shared';
import { useFetchWithCsrf } from '~/composables/use-fetch-with-csrf';
import { type CreditBalance, CreditBalance as CreditBalanceSchema, type CreditEntry } from '~/types/account';
import { logParseFailure } from '~/utils/api-error-handling';
import { useLogger } from '~/utils/use-logger';

interface UseCreditReturn {
  balance: Readonly<Ref<string>>;
  hasHistory: Readonly<Ref<boolean>>;
  history: DeepReadonly<Ref<CreditEntry[]>>;
  load: () => Promise<void>;
  loading: Readonly<Ref<boolean>>;
}

export function useCredit(): UseCreditReturn {
  const loading = ref<boolean>(false);
  const balance = ref<string>('0');
  const history = ref<CreditEntry[]>([]);

  const logger = useLogger('credit');
  const { fetchWithCsrf } = useFetchWithCsrf();

  const hasHistory = computed<boolean>(() => get(history).length > 0);

  async function fetchCredit(): Promise<CreditBalance | undefined> {
    try {
      const response = await fetchWithCsrf<CreditBalance>(
        '/webapi/2/credit/',
        { method: 'GET' },
      );
      const parsed = CreditBalanceSchema.safeParse(response);
      if (!parsed.success) {
        return logParseFailure(parsed, logger, 'credit balance response', response, undefined);
      }
      return parsed.data;
    }
    catch (error) {
      logger.error('Failed to fetch credit balance:', error);
      return undefined;
    }
  }

  async function load(): Promise<void> {
    set(loading, true);
    try {
      const data = await fetchCredit();
      if (data) {
        set(balance, data.balanceEur);
        set(history, data.history);
      }
    }
    finally {
      set(loading, false);
    }
  }

  return {
    balance: readonly(balance),
    hasHistory: readonly(hasHistory),
    history: readonly(history),
    load,
    loading: readonly(loading),
  };
}
