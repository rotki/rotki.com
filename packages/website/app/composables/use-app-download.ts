import type { GithubRelease, GithubReleaseAsset } from '~/types/github';
import { get } from '@vueuse/shared';

export function useAppDownload(fallbackUrl = 'https://github.com/rotki/rotki/releases/latest') {
  const { data, status } = useFetch<GithubRelease>('/api/releases/latest', {
    server: false,
    dedupe: 'defer',
  });

  function findAssetUrl(match: (asset: GithubReleaseAsset) => boolean): string {
    return get(data)?.assets.find(match)?.browser_download_url ?? fallbackUrl;
  }

  const version = computed<string>(() => get(data)?.tag_name ?? '');
  const linuxAppImageUrl = computed<string>(() => findAssetUrl(a => a.name.endsWith('.AppImage')));
  const linuxDebUrl = computed<string>(() => findAssetUrl(a => a.name.endsWith('.deb')));
  const windowsUrl = computed<string>(() => findAssetUrl(a => a.name.endsWith('.exe')));
  const macOSUrl = computed<string>(() => findAssetUrl(a => a.name.endsWith('.dmg') && !a.name.includes('arm64')));
  const macOSArmUrl = computed<string>(() => findAssetUrl(a => a.name.includes('arm64')));
  const loading = computed<boolean>(() => get(status) !== 'success' && get(status) !== 'error');

  return {
    linuxAppImageUrl,
    linuxDebUrl,
    loading,
    macOSArmUrl,
    macOSUrl,
    version,
    windowsUrl,
  };
}
