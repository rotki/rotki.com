import { get, set } from '@vueuse/shared';
import { useLogger } from '~/utils/use-logger';

function isObject(data: any): boolean {
  return typeof data === 'object'
    && data !== null
    && !(data instanceof RegExp)
    && !(data instanceof Error)
    && !(data instanceof Date);
}

function getUpdatedKey(key: string, camelCase: boolean): string {
  if (camelCase) {
    return key.includes('_')
      ? key.replace(/_(.)/gu, (_, p1) => p1.toUpperCase())
      : key;
  }

  return key
    .replace(/([A-Z])/gu, (_, p1, offset, string) => {
      const nextCharOffset = offset + 1;
      if (
        (nextCharOffset < string.length
          && /[A-Z]/.test(string[nextCharOffset]))
        || nextCharOffset === string.length
      ) {
        return p1;
      }

      return `_${p1.toLowerCase()}`;
    })
    .replace(/(\d)/gu, (_, p1, offset, string) => {
      const previousOffset = offset - 1;
      if (previousOffset >= 0 && /\d/.test(string[previousOffset]))
        return p1;

      return `_${p1.toLowerCase()}`;
    });
}

export function convertKeys(data: any, camelCase: boolean, skipKey: boolean): any {
  if (Array.isArray(data))
    return data.map(entry => convertKeys(entry, camelCase, false));

  if (!isObject(data))
    return data;

  const converted: { [key: string]: any } = {};
  for (const key in data) {
    const datum = data[key];
    const updatedKey = skipKey ? key : getUpdatedKey(key, camelCase);

    converted[updatedKey] = isObject(datum)
      ? convertKeys(datum, camelCase, skipKey && key === 'result')
      : datum;
  }
  return converted;
}

export const useSessionIdCookie = createSharedComposable(() => useCookie('sessionid'));

export const useFetchWithCsrf = createSharedComposable(() => {
  const CSRF_HEADER = 'X-CSRFToken';
  const CSRF_COOKIE = 'csrftoken';

  const FETCH_CONFIG = {
    RETRIES: 1,
    RETRY_DELAY_MS: 500,
    TIMEOUT_MS: 30000,
  };

  const HTTP_STATUS = {
    INTERNAL_SERVER_ERROR: 500,
    OK: 200,
    UNAUTHORIZED: 401,
  };

  const logout = ref<() => Promise<void>>();
  const refresh = ref<() => void>();

  const logger = useLogger('fetch');
  const { public: { baseUrl } } = useRuntimeConfig();
  const csrfToken = useCookie(CSRF_COOKIE);

  function setHooks(hooks: {
    logout: () => Promise<void>;
    refresh: () => void;
  }): void {
    set(logout, hooks.logout);
    set(refresh, hooks.refresh);
  }

  async function initCsrf(): Promise<string | undefined> {
    const existingToken = get(csrfToken);

    if (existingToken)
      return existingToken;

    await $fetch('/webapi/csrf/', {
      baseURL: baseUrl,
      credentials: 'include',
      timeout: FETCH_CONFIG.TIMEOUT_MS,
    });

    return get(csrfToken) ?? undefined;
  }

  const fetchWithCsrf = $fetch.create({
    credentials: 'include',
    async onRequest({ options }): Promise<void> {
      const event = typeof useEvent === 'function' ? useEvent() : null;

      let token = event
        ? parseCookies(event)[CSRF_COOKIE]
        : get(csrfToken);

      if (import.meta.client && ['post', 'delete', 'put', 'patch'].includes(options?.method?.toLowerCase() ?? ''))
        token = await initCsrf();

      // Check if the body is FormData
      const isFormData = options.body instanceof FormData;

      let headers: any = {
        accept: 'application/json',
        // Only set content-type for non-FormData requests
        // FormData will set its own boundary parameter for multipart/form-data
        ...(!isFormData && { 'content-type': 'application/json' }),
        ...(token && { [CSRF_HEADER]: token }),
      };

      for (const [key, value] of options.headers) {
        headers[key] = value;
      }

      if (import.meta.server || import.meta.env.NODE_ENV === 'test') {
        const cookieString = event
          ? event.headers.get('cookie')
          : useRequestHeaders(['cookie']).cookie;

        headers = {
          ...headers,
          ...(cookieString && { cookie: cookieString }),
          referer: baseUrl,
        };
      }

      options.headers = headers;
      options.baseURL = baseUrl;
      // Only convert keys for non-FormData bodies
      if (!isFormData) {
        options.body = convertKeys(options.body, false, false);
      }
    },
    onResponse({ response }): Promise<void> | void {
      const status = response.status;
      if ([HTTP_STATUS.OK].includes(status) && isDefined(refresh))
        get(refresh)();
    },
    async onResponseError({ response }): Promise<void> {
      const status = response.status;

      if ([HTTP_STATUS.UNAUTHORIZED].includes(status)) {
        await navigateTo('/login');
        if (isDefined(logout))
          await get(logout)();
      }

      if ([HTTP_STATUS.INTERNAL_SERVER_ERROR].includes(status))
        logger.error('[Error]', response.body);
    },
    parseResponse(responseText: string) {
      return convertKeys(JSON.parse(responseText), true, false);
    },
    retry: FETCH_CONFIG.RETRIES,
    retryDelay: FETCH_CONFIG.RETRY_DELAY_MS,
    timeout: FETCH_CONFIG.TIMEOUT_MS,
  });

  return {
    fetchWithCsrf,
    setHooks,
  };
});
