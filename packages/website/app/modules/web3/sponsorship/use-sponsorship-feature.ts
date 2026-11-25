import { get } from '@vueuse/shared';
import { computed } from 'vue';
import { useAppConfig } from '~/composables/use-app-config';

export function useSponsorshipFeature() {
  const { config, configReady } = useAppConfig();

  const isEnabled = computed<boolean>(() => get(config).sponsorshipEnabled);

  return {
    configReady,
    isEnabled,
  };
}
