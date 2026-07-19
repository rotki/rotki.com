import { get } from '@vueuse/shared';
import { z } from 'zod';

const ActiveCampaignResponse = z.object({
  code: z.string(),
  percent: z.number(),
  period_end: z.string().optional(),
});

export interface ActiveCampaign {
  code: string;
  percent: number;
  periodEnd?: string;
}

const AppConfigResponse = z.object({
  maintenance: z.boolean().default(false),
  sponsorship_enabled: z.boolean().default(false),
  testing: z.boolean().default(false),
  active_campaign: ActiveCampaignResponse.nullish(),
}).transform(data => ({
  maintenance: data.maintenance,
  sponsorshipEnabled: data.sponsorship_enabled,
  testing: data.testing,
  activeCampaign: data.active_campaign
    ? {
      code: data.active_campaign.code,
      percent: data.active_campaign.percent,
      periodEnd: data.active_campaign.period_end,
    } satisfies ActiveCampaign
    : undefined,
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
