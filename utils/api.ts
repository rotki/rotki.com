import { type FetchContext, FetchError, type FetchResponse } from 'ofetch';
import { get, set } from '@vueuse/core';
import type { NitroFetchOptions, NitroFetchRequest } from 'nitropack';

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

export function sleep(ms = 0, signal: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    const id = setTimeout(() => resolve(), ms);
    signal?.addEventListener('abort', () => {
      clearTimeout(id);
      reject(new Error('request aborted'));
    });
  });
}

export async function fetchWithCsrf<
  Resp,
  Req extends NitroFetchRequest = NitroFetchRequest,
>(request: Req, options?: NitroFetchOptions<Req>) {
  const { baseUrl } = useRuntimeConfig().public;

  let token = useCookie(CSRF_COOKIE).value;

  if (
    process.client
    && ['post', 'delete', 'put', 'patch'].includes(
      options?.method?.toLowerCase() ?? '',
    )
  ) {
    await initCsrf();
    token = getCookie(CSRF_COOKIE);
  }

  let headers: any = {
    ...options?.headers,
    ...(token && { [CSRF_HEADER]: token }),
    'accept': 'application/json',
    'content-type': 'application/json',
  };

  if (process.server || process.env.NODE_ENV === 'test') {
    headers = {
      ...headers,
      ...useRequestHeaders(['cookie']),
      referer: baseUrl,
    };
  }

  const controller = new AbortController();
  try {
    const aborter = sleep(30000, controller.signal);
    const fetch = $fetch<Resp>(request, {
      baseURL: baseUrl,
      ...options,
      credentials: 'include',
      headers,
      onRequest(context: FetchContext): void {
        context.options.body = convertKeys(context.options.body, false, false);
      },
      onResponse(
        context: FetchContext & { response: FetchResponse<Req> },
      ): Promise<void> | void {
        if ([200].includes(context.response.status) && isDefined(refresh))
          get(refresh)();
      },
      parseResponse(responseText: string): Req {
        return convertKeys(JSON.parse(responseText), true, false);
      },
      signal: controller.signal,
    });

    const race = await Promise.race<any>([aborter, fetch]);
    if (race === null)
      controller.abort();

    return fetch;
  }
  catch (error) {
    if (!(error instanceof FetchError))
      throw error;

    // when any of the following redirects occur and the final throw is not caught then nuxt SSR will log the following error:
    // [unhandledRejection] Error [ERR_HTTP_HEADERS_SENT]: Cannot set headers after they are sent to the client

    const status = error.response?.status ?? -1;

    if ([401].includes(status)) {
      await navigateTo('/login');
      if (isDefined(logout))
        await get(logout)();
    }

    if ([500].includes(status))
      logger.error('[Error]', error.data?.message, error.data);

    throw error;
  }
  finally {
    controller.abort();
  }
}

async function initCsrf(): Promise<void> {
  const {
    public: { baseUrl },
  } = useRuntimeConfig();

  const controller = new AbortController();
  const aborter = sleep(30000, controller.signal);
  const csrf = $fetch('/webapi/csrf/', {
    baseURL: baseUrl,
    credentials: 'include',
    signal: controller.signal,
  });

  try {
    const race = await Promise.race([aborter, csrf]);
    if (race === null)
      controller.abort();
  }
  finally {
    controller.abort();
  }
}

// https://github.com/axios/axios/blob/bdf493cf8b84eb3e3440e72d5725ba0f138e0451/lib/helpers/cookies.js
function getCookie(name: string) {
  const match = document.cookie.match(new RegExp(`(^|;\\s*)(${name})=([^;]*)`));
  return match ? decodeURIComponent(match[3]) : null;
}

export function replacePathPrefix(prefix: string, path?: string) {
  return path?.startsWith(prefix) ? `${path}`.replace(prefix, '') : path;
}
