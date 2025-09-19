import { get, set } from '@vueuse/core';

interface StoredUrl {
  username: string;
  url: string;
}

export function useRedirectUrl() {
  const storedRedirectUrl = useLocalStorage<StoredUrl>('rotki.redirect_url', null, {
    serializer: {
      read: (v: any) => JSON.parse(v),
      write: (v: any) => JSON.stringify(v),
    },
  });

  const getLastRedirectUrl = (username: string): string | undefined => {
    const stored = get(storedRedirectUrl);
    if (stored && stored.username === username)
      return stored.url;

    return undefined;
  };

  const saveRedirectUrl = (username: string, url: string) => {
    set(storedRedirectUrl, {
      url,
      username,
    });
  };

  const removeStoredRedirectUrl = () => {
    set(storedRedirectUrl, null);
  };

  return {
    getLastRedirectUrl,
    removeStoredRedirectUrl,
    saveRedirectUrl,
  };
}
