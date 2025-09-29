import { useFetchWithCsrf } from '~/composables/use-fetch-with-csrf';
import { type UserDevice, UserDevices } from '~/types/account';

interface UseUserDevicesReturn {
  deleteDevice: (id: number) => Promise<void>;
  loading: Readonly<Ref<boolean>>;
  refresh: () => Promise<void>;
  userDevices: Readonly<Ref<UserDevice[]>>;
}

export function useUserDevices(): UseUserDevicesReturn {
  const { fetchWithCsrf } = useFetchWithCsrf();

  const {
    data: userDevices,
    error,
    execute: refresh,
    pending: loading,
  } = useLazyAsyncData<UserDevice[]>(
    'user-devices',
    async () => {
      const response = await fetchWithCsrf<UserDevices>(
        'webapi/2/devices',
        {
          method: 'GET',
        },
      );
      return UserDevices.parse(response);
    },
    {
      default: () => [] satisfies UserDevice[],
      immediate: false,
    },
  );

  async function deleteDevice(id: number): Promise<void> {
    try {
      await fetchWithCsrf(
        `webapi/2/devices/${id}`,
        {
          method: 'DELETE',
        },
      );
      await refresh();
    }
    catch (error) {
      logger.error(error);
      throw error;
    }
  }

  watch(error, (newError) => {
    if (newError) {
      logger.error('Failed to fetch devices:', newError);
    }
  });

  onBeforeMount(refresh);

  return {
    deleteDevice,
    loading: readonly(loading),
    refresh,
    userDevices: readonly(userDevices) as Readonly<Ref<UserDevice[]>>,
  };
}
