import { convertKeys } from '@rotki/card-payment-common/utils/object';
import { createSharedComposable, isClient } from '@vueuse/core';
import { get, set } from '@vueuse/shared';
import { useLogger } from '~/utils/use-logger';

export const useSessionIdCookie = () => useCookie('sessionid');

export const useAuthHintCookie = () => useCookie('auth_hint');

export const useEmailConfirmedCookie = () => useCookie<boolean>('email_confirmed');

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
  const sessionId = useSessionIdCookie();

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

      // Build the outgoing headers via the Headers API so names are normalised
      // and set() overwrites (instead of appends). ofetch reuses the same
      // `options` object across retries and re-runs this hook over the previous
      // attempt's headers; a plain-object merge would mix `X-CSRFToken` with the
      // lowercased `x-csrftoken` and the Headers constructor would then collapse
      // them into a duplicated "abcd, abcd" value.
      const headers = new Headers();
      headers.set('accept', 'application/json');
      // Only set content-type for non-FormData requests; FormData sets its own
      // boundary parameter for multipart/form-data.
      if (!isFormData)
        headers.set('content-type', 'application/json');

      // Merge any caller-provided headers, normalising case via the Headers API.
      for (const [key, value] of new Headers(options.headers))
        headers.set(key, value);

      // Set the CSRF token last so the freshly resolved token always wins, even
      // when this hook re-runs over a retried request's existing headers.
      if (token)
        headers.set(CSRF_HEADER, token);

      if (import.meta.server || import.meta.env.NODE_ENV === 'test') {
        let cookieString = event?.headers.get('cookie');

        // Only try useRequestHeaders if we have a valid Nuxt context
        const nuxtApp = tryUseNuxtApp();
        if (nuxtApp) {
          try {
            const requestHeaders = useRequestHeaders(['cookie']);
            cookieString = requestHeaders.cookie;
          }
          catch (error: any) {
            logger.error(error);
          }
        }

        // Fallback to session cookie if no cookie string from request headers
        if (!cookieString) {
          const session = get(sessionId);
          if (session && token) {
            cookieString = `${CSRF_COOKIE}=${token}; sessionid=${session}`;
          }
        }

        if (cookieString)
          headers.set('cookie', cookieString);
        headers.set('referer', baseUrl);
      }

      options.headers = headers;
      options.baseURL = baseUrl;
      // Only convert keys for non-FormData bodies
      if (!isFormData) {
        options.body = convertKeys(options.body, false, false);
      }
    },
    onResponse({ response }): Promise<void> | void {
      if (!isClient) {
        return;
      }
      const status = response.status;
      if ([HTTP_STATUS.OK].includes(status) && isDefined(refresh))
        get(refresh)();
    },
    async onResponseError({ response }): Promise<void> {
      const status = response.status;

      if ([HTTP_STATUS.INTERNAL_SERVER_ERROR].includes(status))
        logger.error('[Error]', response.body);

      if (!isClient) {
        return;
      }

      if ([HTTP_STATUS.UNAUTHORIZED].includes(status)) {
        await navigateTo('/login');
        if (isDefined(logout)) {
          await get(logout)();
        }
      }
    },
    parseResponse(responseText: string) {
      return convertKeys(JSON.parse(responseText), true, false);
    },
    retry: FETCH_CONFIG.RETRIES,
    retryDelay: FETCH_CONFIG.RETRY_DELAY_MS,
    // ofetch's default retryStatusCodes includes 429, but retrying a rate-limited
    // request just burns the user's budget and (because Django rotates the CSRF
    // cookie between requests) often comes back as a confusing 403 HTML page.
    retryStatusCodes: [408, 409, 425, 500, 502, 503, 504],
    timeout: FETCH_CONFIG.TIMEOUT_MS,
  });

  return {
    fetchWithCsrf,
    setHooks,
  };
});
