import { createBlockie } from '@rotki/ui-library';

const CACHE_SIZE = 100;

interface UseBlockieReturn {
  cache: Map<string, string>;
  getBlockie: (address?: string) => string;
}

export const useBlockie = createSharedComposable((): UseBlockieReturn => {
  const cache: Map<string, string> = new Map();

  const put = (address: string, image: string): void => {
    const cacheSize = CACHE_SIZE;

    if (cache.size === cacheSize) {
      // Remove the oldest entry (first in map)
      const removeKey = cache.keys().next().value;
      if (removeKey) {
        cache.delete(removeKey);
      }
    }
    cache.set(address, image);
  };

  const getBlockie = (address: string = ''): string => {
    if (!address)
      return '';

    const formatted = address.toLowerCase();

    if (!cache.has(formatted)) {
      const blockie = createBlockie({
        seed: formatted,
      });

      put(formatted, blockie);
    }

    return cache.get(formatted) || '';
  };

  return {
    cache,
    getBlockie,
  };
});
