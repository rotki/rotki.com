import LocalIntegrationData from '~~/public/integrations/all.json';
import { IntegrationData, type IntegrationItem } from '~/types/integrations';

const GITHUB_PREFIX = 'https://raw.githubusercontent.com/rotki/rotki/develop/frontend/app/public/assets/images/protocols/';
const LOCAL_PREFIX = '/img/integrations/';

function localizeImageUrl(url: string): string {
  return url.startsWith(GITHUB_PREFIX) ? url.replace(GITHUB_PREFIX, LOCAL_PREFIX) : url;
}

function localizeData(data: IntegrationData): IntegrationData {
  function localize<T extends { image: string }>(items: T[]): T[] {
    return items.map(item => ({ ...item, image: localizeImageUrl(item.image) }));
  }

  return {
    blockchains: localize(data.blockchains),
    exchanges: localize(data.exchanges),
    protocols: localize(data.protocols),
  };
}

export function useIntegrationsData() {
  const { public: { isDev } } = useRuntimeConfig();

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

  const data = computed<IntegrationData>(() => {
    const parsed = IntegrationData.parse(LocalIntegrationData);
    return isDev ? parsed : localizeData(parsed);
  });

  return {
    data,
    filterDuplicateData,
  };
}
