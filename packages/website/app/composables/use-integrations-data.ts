import LocalIntegrationData from '~~/public/integrations/all.json';
import { IntegrationData, type IntegrationItem } from '~/types/integrations';
import { consolidateSlug, INTEGRATION_CONSOLIDATIONS, integrationSlug } from '~/utils/integration-slug';

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
    // Fold rotki's granular catalog entries into one card per consolidated page using the
    // explicit whitelist (e.g. the four "Makerdao *" entries -> a single "MakerDAO" card).
    // Everything else keeps its own card, so unrelated entries that share a first word
    // (Coinbase / Coinbase Pro, FTX / FTX US, Gnosis Pay / Gnosis Chain) are never merged.
    const byCanonical: Record<string, IntegrationItem> = {};

    data.protocols.forEach((protocol) => {
      const canonical = consolidateSlug(integrationSlug(protocol.label));
      if (byCanonical[canonical])
        return;

      const group = INTEGRATION_CONSOLIDATIONS[canonical];
      byCanonical[canonical] = group ? { ...protocol, label: group.label } : { ...protocol };
    });

    return {
      ...data,
      protocols: Object.values(byCanonical),
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
