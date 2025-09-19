import { get, set } from '@vueuse/core';
import { useLogger } from '~/utils/use-logger';

interface Asset {
  readonly name: string;

  readonly browser_download_url: string;
}

interface GithubRelease {
  readonly tag_name: string;
  readonly assets: Asset[];
}

export function useAppDownload(fallbackUrl = 'https://github.com/rotki/rotki/releases/latest') {
  const version = ref('');
  const linuxUrl = ref(fallbackUrl);
  const macOSUrl = ref(fallbackUrl);
  const macOSArmUrl = ref(fallbackUrl);
  const windowsUrl = ref(fallbackUrl);

  const logger = useLogger('download');

  function getUrl(assets: Asset[], filter: (asset: Asset) => boolean): string {
    const matched = assets.filter(filter);
    return matched.length === 0 ? fallbackUrl : matched[0].browser_download_url;
  }

  function isWindowApp(name: string): boolean {
    return name.endsWith('.exe') && name.startsWith('rotki-win32');
  }

  function isLinuxApp(name: string): boolean {
    return name.endsWith('.AppImage');
  }

  function isMacOsApp(name: string, arm64 = false): boolean {
    const archMatch
      = (arm64 && name.includes('arm64')) || (!arm64 && name.includes('x64'));
    return archMatch && name.endsWith('.dmg');
  }

  const fetchLatestRelease = async () => {
    try {
      const { data, refresh } = await useFetch<GithubRelease>(
        'https://api.github.com/repos/rotki/rotki/releases/latest',
      );

      if (!get(data))
        await refresh();

      const latestRelease = get(data);
      if (latestRelease) {
        set(version, latestRelease.tag_name);
        const assets: Asset[] = latestRelease.assets;
        set(
          macOSUrl,
          getUrl(assets, ({ name }) => isMacOsApp(name)),
        );

        set(
          macOSArmUrl,
          getUrl(assets, ({ name }) => isMacOsApp(name, true)),
        );
        set(
          linuxUrl,
          getUrl(assets, ({ name }) => isLinuxApp(name)),
        );
        set(
          windowsUrl,
          getUrl(assets, ({ name }) => isWindowApp(name)),
        );
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
