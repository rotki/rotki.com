import { convertKeys } from '~/utils/api';
import { IntegrationData } from '~/types/integrations';
import LocalIntegrationData from '~/public/integrations/all.json';

export const useIntegrationsData = createSharedComposable(() => {
  const defaultData = () => ({
    blockchains: [],
    exchanges: [],
    protocols: [],
  });

  const { public: { isDev, testing } } = useRuntimeConfig();

  const getRemoteIntegrationData = async (): Promise<IntegrationData | null> => {
    const branch = testing ? 'develop' : 'main';
    try {
      const response = await $fetch<IntegrationData>(
        `https://raw.githubusercontent.com/rotki/rotki.com/${branch}/public/integrations/all.json`,
        {
          parseResponse(responseText: string) {
            return convertKeys(JSON.parse(responseText), true, false);
          },
        },
      );
      return IntegrationData.parse(response);
    }
    catch (error: any) {
      logger.error(error);

      return null;
    }
  };

  const data = asyncComputed<IntegrationData>(async () => {
    if (isDev)
      return LocalIntegrationData;

    const remoteData = await getRemoteIntegrationData();

    if (remoteData)
      return remoteData;

    return defaultData();
  }, defaultData());

  return {
    data,
  };
});
