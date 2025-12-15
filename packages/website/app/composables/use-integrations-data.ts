import LocalIntegrationData from '~~/public/integrations/all.json';
import { IntegrationData, type IntegrationItem } from '~/types/integrations';

export const useIntegrationsData = createSharedComposable(() => {
  const filterDuplicateData = (data: IntegrationData): IntegrationData => {
    const uniqueProtocols: Record<string, IntegrationItem> = {};

    data.protocols.forEach((protocol) => {
      const firstWord = protocol.label.split(' ')[0];
      if (!firstWord)
        return;

      const existing = uniqueProtocols[firstWord];
      if (!existing || existing.image !== protocol.image) {
        uniqueProtocols[firstWord] = { ...protocol };
      }
      else {
        existing.label = firstWord;
      }
    });

    return {
      ...data,
      protocols: Object.values(uniqueProtocols),
    };
  };

  // useFetch for SSR - fetches on server, hydrates to client
  const { data } = useFetch<IntegrationData>('/api/integrations', {
    key: 'integrations',
    default: () => LocalIntegrationData,
    transform: response => IntegrationData.parse(response),
  });

  return {
    data,
    filterDuplicateData,
  };
});
