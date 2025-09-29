import { convertKeys } from '@rotki/card-payment-common/utils/object';
import { get, set } from '@vueuse/core';
import {
  DashboardSchema,
  type VisibilityPeriod,
} from '@/types/dynamic-messages';

export const useDynamicMessages = createSharedComposable(() => {
  const { public: { testing } } = useRuntimeConfig();

  const branch = testing ? 'develop' : 'main';
  const dashboardMessages = ref<DashboardSchema>([]);

  const getValidMessages = <T extends { period: VisibilityPeriod }>(
    messages: T[],
  ): T[] => {
    const now = Date.now() / 1000;

    return messages.filter(x => x.period.start <= now && x.period.end > now);
  };

  const activeDashboardMessages = computed(() => {
    if (!isDefined(dashboardMessages))
      return [];

    return getValidMessages(get(dashboardMessages));
  });

  const getDashboardData = async (): Promise<DashboardSchema | null> => {
    try {
      const response = await $fetch<DashboardSchema>(
        `https://raw.githubusercontent.com/rotki/data/${branch}/messages/dashboard.json`,
        {
          parseResponse(responseText: string) {
            return convertKeys(JSON.parse(responseText), true, false);
          },
        },
      );
      return DashboardSchema.parse(response);
    }
    catch (error: any) {
      logger.error(error);

      return null;
    }
  };

  const fetchMessages = async () => {
    set(dashboardMessages, await getDashboardData());
  };

  return {
    activeDashboardMessages,
    fetchMessages,
  };
});
