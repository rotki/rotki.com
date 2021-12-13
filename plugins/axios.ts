import {
  AxiosError,
  AxiosRequestConfig,
  AxiosResponse,
  AxiosTransformer,
} from 'axios'
import { Plugin } from '@nuxt/types'
import { NuxtAxiosInstance } from '@nuxtjs/axios'
import { defineNuxtPlugin, useRouter } from '@nuxtjs/composition-api'
import { useMainStore } from '~/store'
import { assert } from '~/components/utils/assertions'

const isObject = (data: any): boolean =>
  typeof data === 'object' &&
  data !== null &&
  !(data instanceof RegExp) &&
  !(data instanceof Error) &&
  !(data instanceof Date)

function getUpdatedKey(key: string, camelCase: boolean) {
  if (camelCase) {
    return key.includes('_')
      ? key.replace(/_(.)/gu, (_, p1) => p1.toUpperCase())
      : key
  }

  return key
    .replace(/([A-Z])/gu, (_, p1, offset, string) => {
      const nextCharOffset = offset + 1
      if (
        (nextCharOffset < string.length &&
          /([A-Z])/.test(string[nextCharOffset])) ||
        nextCharOffset === string.length
      ) {
        return p1
      }
      return `_${p1.toLowerCase()}`
    })
    .replace(/([0-9])/gu, (_, p1, offset, string) => {
      const previousOffset = offset - 1
      if (previousOffset >= 0 && /([0-9])/.test(string[previousOffset])) {
        return p1
      }
      return `_${p1.toLowerCase()}`
    })
}

export const convertKeys = (
  data: any,
  camelCase: boolean,
  skipKey: boolean
): any => {
  if (Array.isArray(data)) {
    return data.map((entry) => convertKeys(entry, camelCase, false))
  }

  if (!isObject(data)) {
    return data
  }

  const converted: { [key: string]: any } = {}
  for (const key in data) {
    const datum = data[key]
    const updatedKey = skipKey ? key : getUpdatedKey(key, camelCase)

    converted[updatedKey] = isObject(datum)
      ? convertKeys(datum, camelCase, skipKey && key === 'result')
      : datum
  }
  return converted
}

export const axiosSnakeCaseTransformer: AxiosTransformer = (data, _headers) =>
  convertKeys(data, false, false)

export const axiosCamelCaseTransformer: AxiosTransformer = (data, _headers) =>
  convertKeys(data, true, false)

declare module 'vue/types/vue' {
  interface Vue {
    $api: NuxtAxiosInstance
  }
}

declare module '@nuxt/types' {
  interface NuxtAppOptions {
    $api: NuxtAxiosInstance
  }

  interface Context {
    $api: NuxtAxiosInstance
  }
}

declare module 'vuex/types/index' {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  interface Store<S> {
    $api: NuxtAxiosInstance
  }
}

let apiInstance: NuxtAxiosInstance | null = null

export const useApi = (): NuxtAxiosInstance => {
  assert(apiInstance)
  return apiInstance
}

const axiosPlugin: Plugin = defineNuxtPlugin(({ $axios }, inject) => {
  // https://stackoverflow.com/a/15724300
  const getCookie = (name: string) => {
    const value = `; ${document.cookie}`
    const parts = value.split(`; ${name}=`)
    if (parts.length === 2) {
      const pop = parts.pop() ?? ''
      return pop.split(';').shift()
    }
  }

  function getDefaultTransformers(
    defaults?: AxiosTransformer | AxiosTransformer[]
  ): AxiosTransformer[] {
    if (Array.isArray(defaults)) {
      return defaults
    } else if (!defaults) {
      return []
    }
    return [defaults]
  }

  const transformRequest = getDefaultTransformers(
    $axios.defaults.transformRequest
  )
  const $api = $axios.create({
    baseURL: process.env.baseUrl,
    transformResponse: [axiosCamelCaseTransformer],
  })
  apiInstance = $api

  $api.defaults.transformRequest = [
    axiosSnakeCaseTransformer,
    ...transformRequest,
  ]

  $api.interceptors.request.use(
    (config: AxiosRequestConfig) => {
      // Do something before each request is sent
      const c = config

      // this cookie must be sent with each axios request
      // in order for POST / PUT /DELETE http methods to work

      // only do this on the client
      if (process.client) {
        const cookie = getCookie('csrftoken') || ''

        if (cookie) {
          c.headers['X-CSRFToken'] = cookie
        }
      }

      return c
    },
    (error: AxiosError) => {
      Promise.reject(error)
    }
  )

  const { logout } = useMainStore()
  function handleError(error: AxiosError) {
    const router = useRouter()
    switch (error.response?.status) {
      case 401:
        logout()
        router.push('/login')
        break
      default:
        break
    }
    return Promise.reject(error)
  }

  $api.interceptors.response.use(function <T>(response: AxiosResponse<T>) {
    return response
  }, handleError)

  inject('api', $api)
})

export default axiosPlugin
