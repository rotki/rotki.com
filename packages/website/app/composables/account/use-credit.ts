import type { DeepReadonly, Ref } from 'vue';
import { set } from '@vueuse/shared';
import { FetchError } from 'ofetch';
import { err, ok, type Result } from 'plainfp/result';
import { useFetchWithCsrf } from '~/composables/use-fetch-with-csrf';
import { type CreditBalance, CreditBalance as CreditBalanceSchema, type CreditEntry } from '~/types/account';
import { logParseFailure } from '~/utils/api-error-handling';
import { useLogger } from '~/utils/use-logger';

interface UseCreditReturn {
  balance: Readonly<Ref<string>>;
  history: DeepReadonly<Ref<CreditEntry[]>>;
  initialLoading: Readonly<Ref<boolean>>;
  /** The balance could not be loaded, so it says nothing about what the account has. */
  loadFailed: Readonly<Ref<boolean>>;
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
  const loadFailed = shallowRef<boolean>(false);

  const logger = useLogger('credit');
  const { fetchWithCsrf } = useFetchWithCsrf();

  /** The balance; `undefined` when the account has none yet, which the backend answers with a 404. */
  async function fetchCredit(): Promise<Result<CreditBalance | undefined, unknown>> {
    try {
      const response = await fetchWithCsrf<CreditBalance>(
        '/webapi/2/credit/',
        { method: 'GET' },
      );
      const parsed = CreditBalanceSchema.safeParse(response);
      if (!parsed.success)
        return err(logParseFailure(parsed, logger, 'credit balance response', response, parsed.error));
      return ok(parsed.data);
    }
    catch (error) {
      if (error instanceof FetchError && error.status === 404)
        return ok(undefined);
      logger.error('Failed to fetch credit balance:', error);
      return err(error);
    }
  }

  async function load(): Promise<void> {
    set(loading, true);
    try {
      const credit = await fetchCredit();
      set(loadFailed, !credit.ok);
      if (credit.ok && credit.value) {
        set(balance, credit.value.balanceEur);
        set(history, credit.value.history);
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
    loadFailed: readonly(loadFailed),
    loading: readonly(loading),
  };
}
