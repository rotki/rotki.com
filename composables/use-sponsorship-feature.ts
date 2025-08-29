export function useSponsorshipFeature() {
  const { $config } = useNuxtApp();
  const isEnabled = computed<boolean>(() => $config.public.sponsorshipEnabled);

  return {
    isEnabled: readonly(isEnabled),
  };
}
