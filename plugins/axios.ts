import { AxiosError, AxiosRequestConfig } from 'axios'
import { Plugin } from '@nuxt/types'
import { NuxtAxiosInstance } from '@nuxtjs/axios'
import { defineNuxtPlugin } from '@nuxtjs/composition-api'

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
  const $api = $axios.create()

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
