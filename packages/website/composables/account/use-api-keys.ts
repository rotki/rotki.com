import { get, set } from '@vueuse/core';
import { storeToRefs } from 'pinia';
import { useAccountApi } from '~/composables/account/use-account-api';
import { useMainStore } from '~/store';
import { assert } from '~/utils/assert';

export function useApiKeys() {
  const store = useMainStore();
  const { account } = storeToRefs(store);
  const accountApi = useAccountApi();

  const loading = ref<boolean>(false);

  const apiKey = computed<string>(() => get(account)?.apiKey ?? '');
  const apiSecret = computed<string>(() => get(account)?.apiSecret ?? '');
  const hasApiKeys = computed<boolean>(() => !!get(apiKey) && !!get(apiSecret));

  const updateKeys = async (): Promise<void> => {
    set(loading, true);
    try {
      const keys = await accountApi.updateKeys();
      if (keys) {
        const acc = get(account);
        assert(acc);
        set(account, {
          ...acc,
          ...keys,
        });
      }
    }
    finally {
      set(loading, false);
    }
  };

  return {
    apiKey: readonly(apiKey),
    apiSecret: readonly(apiSecret),
    hasApiKeys: readonly(hasApiKeys),
    loading: readonly(loading),
    updateKeys,
  };
}
