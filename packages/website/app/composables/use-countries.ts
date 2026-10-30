import type { ApiResponse } from '@rotki/card-payment-common/schemas/api';
import { get } from '@vueuse/shared';
import { useFetchWithCsrf } from '~/composables/use-fetch-with-csrf';

export interface Country {
  readonly code: string;
  readonly name: string;
}

/** The country list, fetched once per visit and shared by every caller. */
export function useCountries() {
  const { fetchWithCsrf } = useFetchWithCsrf();

  const { data, error } = useLazyAsyncData<Country[]>(
    'countries',
    async () => {
      const response = await fetchWithCsrf<ApiResponse<Country[]>>('/webapi/countries/');
      return response.result ?? [];
    },
    {
      default: () => [],
      getCachedData: (key, nuxtApp) => nuxtApp.payload.data[key] ?? nuxtApp.static.data[key],
      server: false,
    },
  );

  return {
    countries: computed<Country[]>(() => get(data)),
    countriesLoadError: computed<string>(() => get(error)?.message ?? ''),
  };
}
