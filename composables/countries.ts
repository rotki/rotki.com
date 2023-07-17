import { type Ref } from 'vue';
import { type ApiResponse } from '~/types';

export interface Country {
  readonly code: string;
  readonly name: string;
}

export const useCountries = () => {
  const countries: Ref<Country[]> = ref([]);
  const countriesLoadError: Ref<string> = ref('');

  const loadCountries = async () => {
    try {
      const response = await fetchWithCsrf<ApiResponse<Country[]>>(
        '/webapi/countries/',
      );
      countries.value = response.result ?? [];
    } catch (e: any) {
      countriesLoadError.value = e.message;
    }
  };
  onMounted(loadCountries);
  return {
    countries,
    countriesLoadError,
  };
};
