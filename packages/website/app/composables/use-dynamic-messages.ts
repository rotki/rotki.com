import { convertKeys } from '@rotki/card-payment-common/utils/object';
import { get, set } from '@vueuse/shared';
import {
  DashboardSchema,
  type VisibilityPeriod,
} from '@/types/dynamic-messages';
import { useAppConfig } from '~/composables/use-app-config';
import { logger } from '~/utils/use-logger';

export const useDynamicMessages = createSharedComposable(() => {
  const dashboardMessages = ref<DashboardSchema>([]);
  const { contentBranch: branch } = useAppConfig();

  const getValidMessages = <T extends { period: VisibilityPeriod }>(
    messages: T[],
  ): T[] => {
    const now = Date.now() / 1000;

    return messages.filter(x => x.period.start <= now && x.period.end > now);
  };

  const activeDashboardMessages = computed<DashboardSchema>(() => {
    if (!isDefined(dashboardMessages))
      return [];

    return getValidMessages(get(dashboardMessages));
  });

  const getDashboardData = async (): Promise<DashboardSchema | null> => {
    try {
      const response = await $fetch<DashboardSchema>(
        `https://raw.githubusercontent.com/rotki/data/${get(branch)}/messages/dashboard.json`,
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
