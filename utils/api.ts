import { get, set } from '@vueuse/core';

function isObject(data: any): boolean {
  return typeof data === 'object'
    && data !== null
    && !(data instanceof RegExp)
    && !(data instanceof Error)
    && !(data instanceof Date);
}

function getUpdatedKey(key: string, camelCase: boolean) {
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
        && /([A-Z])/.test(string[nextCharOffset]))
        || nextCharOffset === string.length
      )
        return p1;

      return `_${p1.toLowerCase()}`;
    })
    .replace(/([0-9])/gu, (_, p1, offset, string) => {
      const previousOffset = offset - 1;
      if (previousOffset >= 0 && /(\d)/.test(string[previousOffset]))
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

const TIMEOUT = 30000;
const CSRF_COOKIE = 'csrftoken';

export const SESSION_COOKIE = 'sessionid';
const CSRF_HEADER = 'X-CSRFToken';

const logout = ref<() => Promise<void>>();
const refresh = ref<() => void>();

export function setHooks(hooks: {
  logout: () => Promise<void>;
  refresh: () => void;
}) {
  set(logout, hooks.logout);
  set(refresh, hooks.refresh);
}

export const fetchWithCsrf = $fetch.create({
  credentials: 'include',
  async onRequest({ options }) {
    const { baseUrl } = useRuntimeConfig().public;
    const event = typeof useEvent === 'function' ? useEvent() : null;

    let token = event
      ? parseCookies(event)[CSRF_COOKIE]
      : useCookie(CSRF_COOKIE).value;

    if (process.client && ['post', 'delete', 'put', 'patch'].includes(options?.method?.toLowerCase() ?? ''))
      token = await initCsrf();

    let headers: any = {
      'accept': 'application/json',
      'content-type': 'application/json',
      ...(token && { [CSRF_HEADER]: token }),
      ...options?.headers,
    };

    if (process.server || process.env.NODE_ENV === 'test') {
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
    options.body = convertKeys(options.body, false, false);
  },
  onResponse({ response }): Promise<void> | void {
    const status = response.status;
    if ([200].includes(status) && isDefined(refresh))
      get(refresh)();
  },
  async onResponseError({ response }) {
    // when any of the following redirects occur and the final throw is not caught then nuxt SSR will log the following error:
    // [unhandledRejection] Error [ERR_HTTP_HEADERS_SENT]: Cannot set headers after they are sent to the client
    const status = response.status;

    if ([401].includes(status)) {
      await navigateTo('/login');
      if (isDefined(logout))
        await get(logout)();
    }

    if ([500].includes(status))
      logger.error('[Error]', response.body);
  },
  parseResponse(responseText: string) {
    return convertKeys(JSON.parse(responseText), true, false);
  },
  timeout: TIMEOUT,
});

async function initCsrf(): Promise<string | undefined | null> {
  const { baseUrl } = useRuntimeConfig().public;
  const existingToken = useCookie(CSRF_COOKIE).value;

  if (existingToken)
    return existingToken;

  await $fetch('/webapi/csrf/', {
    baseURL: baseUrl,
    credentials: 'include',
    timeout: TIMEOUT,
  });

  return useCookie(CSRF_COOKIE).value;
}

// https://github.com/axios/axios/blob/bdf493cf8b84eb3e3440e72d5725ba0f138e0451/lib/helpers/cookies.js
export function replacePathPrefix(prefix: string, path?: string) {
  return path?.startsWith(prefix) ? `${path}`.replace(prefix, '') : path;
}
