import { get } from '@vueuse/shared';
import { z } from 'zod';

const AppConfigResponse = z.object({
  maintenance: z.boolean().default(false),
  sponsorship_enabled: z.boolean().default(false),
  testing: z.boolean().default(false),
}).transform(data => ({
  maintenance: data.maintenance,
  sponsorshipEnabled: data.sponsorship_enabled,
  testing: data.testing,
}));

type AppConfig = z.output<typeof AppConfigResponse>;

const defaultConfig: AppConfig = {
  maintenance: false,
  sponsorshipEnabled: false,
  testing: false,
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
  const configReady = computed<boolean>(() => get(status) === 'success');
  const contentBranch = computed<string>(() => get(isTesting) ? 'develop' : 'main');

  return {
    config: readonly(data),
    configReady: readonly(configReady),
    contentBranch: readonly(contentBranch),
    isMaintenance: readonly(isMaintenance),
    isTesting: readonly(isTesting),
  };
}
