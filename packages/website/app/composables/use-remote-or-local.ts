import { logger } from '~/utils/use-logger';

type Awaitable<T> = () => Promise<T>;

interface UseRemoteOrLocalReturn {
  fallbackToLocalOnError: <T>(remote: Awaitable<T>, local: Awaitable<T>) => Promise<T>;
}

export function useRemoteOrLocal(): UseRemoteOrLocalReturn {
  const { public: { isDev } } = useRuntimeConfig();

  const fallbackToLocalOnError = async <T>(remote: Awaitable<T>, local: Awaitable<T>): Promise<T> => {
    if (isDev) {
      return local();
    }

    try {
      const result = await remote();
      if (result && (!Array.isArray(result) || result.length > 0)) {
        return result;
      }

      return await local();
    }
    catch (error: any) {
      logger.error(
        'Failed to fetch remote data, falling back to local data',
        error,
      );
      return local();
    }
  };

  return {
    fallbackToLocalOnError,
  };
}
