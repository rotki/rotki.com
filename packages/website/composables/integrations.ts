import LocalIntegrationData from '~/public/integrations/all.json';
import { IntegrationData, type IntegrationItem } from '~/types/integrations';
import { convertKeys } from '~/utils/object';

export const useIntegrationsData = createSharedComposable(() => {
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

  const filterDuplicateData = (data: IntegrationData): IntegrationData => {
    const uniqueProtocols: Record<string, IntegrationItem> = {};

    data.protocols.forEach((protocol) => {
      const firstWord = protocol.label.split(' ')[0]; // Get the first word of label

      // Check if we already have an entry with this first word and same image
      if (!(firstWord in uniqueProtocols) || uniqueProtocols[firstWord].image !== protocol.image) {
        // If not, add it to uniqueProtocols
        uniqueProtocols[firstWord] = { ...protocol };
      }
      else {
        // If there's a duplicate, modify the label of the existing one
        uniqueProtocols[firstWord].label = firstWord;
      }
    });

    const uniqueProtocolList = Object.values(uniqueProtocols);

    return {
      ...data,
      protocols: uniqueProtocolList,
    };
  };

  const data = asyncComputed<IntegrationData>(async () => {
    let data: IntegrationData;
    if (isDev) {
      data = LocalIntegrationData;
    }
    else {
      data = await getRemoteIntegrationData() ?? LocalIntegrationData;
    }
    return data;
  }, LocalIntegrationData);

  return {
    data,
    filterDuplicateData,
  };
});
