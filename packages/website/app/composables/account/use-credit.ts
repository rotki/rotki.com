import type { DeepReadonly, Ref } from 'vue';
import { set } from '@vueuse/shared';
import { useFetchWithCsrf } from '~/composables/use-fetch-with-csrf';
import { type CreditBalance, CreditBalance as CreditBalanceSchema, type CreditEntry } from '~/types/account';
import { logParseFailure } from '~/utils/api-error-handling';
import { useLogger } from '~/utils/use-logger';

interface UseCreditReturn {
  balance: Readonly<Ref<string>>;
  history: DeepReadonly<Ref<CreditEntry[]>>;
  initialLoading: Readonly<Ref<boolean>>;
  load: () => Promise<void>;
  loading: Readonly<Ref<boolean>>;
}

interface UseCreditOptions {
  /** Loads the balance once this is true, such as when the account's e-mail address is confirmed. */
  loadWhen?: MaybeRefOrGetter<boolean>;
}

export function useCredit({ loadWhen }: UseCreditOptions = {}): UseCreditReturn {
  const loading = shallowRef<boolean>(false);
  const initialLoading = shallowRef<boolean>(true);
  const balance = shallowRef<string>('0');
  const history = ref<CreditEntry[]>([]);

  const logger = useLogger('credit');
  const { fetchWithCsrf } = useFetchWithCsrf();

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
      set(initialLoading, false);
    }
  }

  if (loadWhen !== undefined) {
    watchImmediate(() => toValue(loadWhen), async (ready) => {
      if (ready)
        await load();
    });
  }

  return {
    balance: readonly(balance),
    history: readonly(history),
    initialLoading: readonly(initialLoading),
    load,
    loading: readonly(loading),
  };
}
