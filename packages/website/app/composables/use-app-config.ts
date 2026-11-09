import { type ActiveCampaign, ActiveCampaignSchema } from '@rotki/card-payment-common/schemas/campaign';
import { convertKeys } from '@rotki/card-payment-common/utils/object';
import { get } from '@vueuse/shared';
import { z } from 'zod';

const AppConfigResponse = z.object({
  maintenance: z.boolean().default(false),
  sponsorship_enabled: z.boolean().default(false),
  testing: z.boolean().default(false),
  active_campaign: z.preprocess(value => (value ? convertKeys(value, true, false) : value), ActiveCampaignSchema.nullish()),
}).transform(data => ({
  maintenance: data.maintenance,
  sponsorshipEnabled: data.sponsorship_enabled,
  testing: data.testing,
  activeCampaign: data.active_campaign ?? undefined,
}));

type AppConfig = z.output<typeof AppConfigResponse>;

const defaultConfig: AppConfig = {
  maintenance: false,
  sponsorshipEnabled: false,
  testing: false,
  activeCampaign: undefined,
};

export function useAppConfig() {
  const { data, status } = useFetch('/api/config', {
    dedupe: 'defer',
    default: (): AppConfig => ({ ...defaultConfig }),
    server: false,
    transform: response => AppConfigResponse.parse(response),
  });

  const isMaintenance = computed<boolean>(() => get(data).maintenance);
  const isTesting = computed<boolean>(() => get(data).testing);
  const activeCampaign = computed<ActiveCampaign | undefined>(() => get(data).activeCampaign);
  const configReady = computed<boolean>(() => get(status) === 'success');
  const contentBranch = computed<string>(() => get(isTesting) ? 'develop' : 'main');

  return {
    activeCampaign,
    config: readonly(data),
    configReady,
    contentBranch,
    isMaintenance,
    isTesting,
  };
}
