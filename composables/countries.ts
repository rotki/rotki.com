import { onMounted, ref, useContext } from '@nuxtjs/composition-api'
import { ApiResponse } from '~/types'

export interface Country {
  readonly code: string
  readonly name: string
}

export const loadCountries = () => {
  const countries = ref<Country[]>([])
  const countriesLoadError = ref('')
  const { $axios } = useContext()
  const loadCountries = async () => {
    try {
      const response = await $axios.get<ApiResponse<Country[]>>(
        '/webapi/countries/'
      )
      countries.value = response.data.result
    } catch (e) {
      countriesLoadError.value = e.message
    }
  }
  onMounted(loadCountries)
  return {
    countries,
    countriesLoadError,
  }
}
