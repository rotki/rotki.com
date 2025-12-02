import type { Validation } from '@vuelidate/core';
import type { ProfilePayload } from '~/types/account';
import { get, objectOmit, set } from '@vueuse/core';
import { storeToRefs } from 'pinia';
import { useAccountApi } from '~/composables/use-account-api';
import { useAccountRefresh } from '~/composables/use-app-events';
import { useMainStore } from '~/store';

type ProfileOmitFields = 'movedOffline';

export function useProfileUpdate() {
  const store = useMainStore();
  const { account } = storeToRefs(store);
  const accountApi = useAccountApi();
  const { requestRefresh } = useAccountRefresh();

  const loading = ref<boolean>(false);
  const done = ref<boolean>(false);
  const $externalResults = ref<Record<string, string[]>>({});

  const movedOffline = computed<boolean>(() => get(account)?.address.movedOffline ?? false);

  /**
   * Update user profile with validated form data
   */
  const updateProfile = async <T extends Partial<ProfilePayload>>(
    v$: Ref<Validation>,
    state: T,
    omitFields: ProfileOmitFields[] = ['movedOffline'],
  ): Promise<boolean> => {
    const userAccount = get(account);
    if (!userAccount)
      return false;

    const isValid = await get(v$).$validate();
    if (!isValid)
      return false;

    set(loading, true);

    const payload = objectOmit(
      {
        ...userAccount.address,
        ...state,
      },
      omitFields,
    ) as ProfilePayload;

    const result = await accountApi.updateProfile(payload);

    if (result.success) {
      requestRefresh();
    }

    if (result.success) {
      set(done, true);
    }
    else if (result.message && typeof result.message !== 'string') {
      set($externalResults, result.message);
    }

    set(loading, false);
    return result.success;
  };

  return {
    $externalResults,
    account: readonly(account),
    done,
    loading: readonly(loading),
    movedOffline: readonly(movedOffline),
    updateProfile,
  };
}
