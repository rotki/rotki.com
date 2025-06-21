import { set } from '@vueuse/core';
import { UserDevices } from '~/types/account';

export function useUserDevices() {
  const userDevices = ref<UserDevices>([]);

  async function fetchDevices(): Promise<void> {
    try {
      const response = await fetchWithCsrf<UserDevices>(
        'webapi/2/devices',
        {
          method: 'GET',
        },
      );

      const parsed = UserDevices.parse(response);
      set(userDevices, parsed);
    }
    catch (error) {
      logger.error(error);
    }
  }

  async function deleteDevice(id: number): Promise<void> {
    try {
      await fetchWithCsrf<UserDevices>(
        `webapi/2/devices/${id}`,
        {
          method: 'DELETE',
        },
      );
    }
    catch (error) {
      logger.error(error);
    }
  }

  return {
    deleteDevice,
    fetchDevices,
    userDevices,
  };
}
