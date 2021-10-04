import { AxiosError, AxiosRequestConfig, AxiosTransformer } from 'axios'
import { Plugin } from '@nuxt/types'
import { NuxtAxiosInstance } from '@nuxtjs/axios'
import { defineNuxtPlugin } from '@nuxtjs/composition-api'

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

  return key.replace(/([A-Z])/gu, (_, p1, offset, string) => {
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

export const axiosNoRootCamelCaseTransformer: AxiosTransformer = (
  data,
  _headers
) => convertKeys(data, true, true)

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

  // function handleSuccess(response) {
  //   return { data: response.data }
  // }
  //
  // function handleError(error) {
  //   // console.log(error)
  //   switch (error.response.status) {
  //     case 400:
  //       break
  //     case 401:
  //       // Log out user, remove token, clear state and redirect to login
  //       break
  //     case 404:
  //       // Show 404 page
  //       break
  //     case 500:
  //       // Server error redirect to 500
  //       break
  //     default:
  //       // Unknow error
  //       break
  //   }
  //   return Promise.reject(error)
  // }
  //
  // $api.interceptors.response.use(handleSuccess, handleError)

  inject('api', $api)
})

export default axiosPlugin
