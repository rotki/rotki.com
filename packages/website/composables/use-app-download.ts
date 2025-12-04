import type { GithubRelease } from '~/types/github';
import { get, set } from '@vueuse/core';
import { useLogger } from '~/utils/use-logger';

export function useAppDownload(fallbackUrl = 'https://github.com/rotki/rotki/releases/latest') {
  const version = ref<string>('');
  const linuxUrl = ref<string>(fallbackUrl);
  const macOSUrl = ref<string>(fallbackUrl);
  const macOSArmUrl = ref<string>(fallbackUrl);
  const windowsUrl = ref<string>(fallbackUrl);

  const logger = useLogger('download');

  const fetchLatestRelease = async (): Promise<void> => {
    try {
      const { data, refresh } = await useFetch<GithubRelease>(
        '/api/releases/latest',
      );

      if (!get(data))
        await refresh();

      const latestRelease = get(data);
      if (latestRelease) {
        set(version, latestRelease.tag_name);
        // Server pre-filters to only downloadable assets (exe, AppImage, dmg)
        for (const { name, browser_download_url: url } of latestRelease.assets) {
          if (name.endsWith('.exe'))
            set(windowsUrl, url);
          else if (name.endsWith('.AppImage'))
            set(linuxUrl, url);
          else if (name.includes('arm64'))
            set(macOSArmUrl, url);
          else if (name.endsWith('.dmg'))
            set(macOSUrl, url);
        }
      }
    }
    catch (error) {
      logger.error(error);
    }
  };

  return {
    fetchLatestRelease,
    linuxUrl,
    macOSArmUrl,
    macOSUrl,
    version,
    windowsUrl,
  };
}
