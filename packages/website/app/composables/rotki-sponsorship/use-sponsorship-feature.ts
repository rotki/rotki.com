import { get } from '@vueuse/shared';
import { useAppConfig } from '~/composables/use-app-config';

export function useSponsorshipFeature() {
  const { config } = useAppConfig();

  const isEnabled = computed<boolean>(() => get(config).sponsorshipEnabled);

  return {
    isEnabled: readonly(isEnabled),
  };
}
