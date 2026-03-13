import { get } from '@vueuse/shared';
import { z } from 'zod';

const AppConfigResponse = z.object({
  sponsorship_enabled: z.boolean(),
}).transform(data => ({
  sponsorshipEnabled: data.sponsorship_enabled,
}));

type AppConfig = z.output<typeof AppConfigResponse>;

export function useSponsorshipFeature() {
  const { data } = useFetch('/api/config', {
    dedupe: 'defer',
    default: (): AppConfig => ({ sponsorshipEnabled: false }),
    server: false,
    transform: response => AppConfigResponse.parse(response),
  });

  const isEnabled = computed<boolean>(() => get(data).sponsorshipEnabled);

  return {
    isEnabled: readonly(isEnabled),
  };
}
