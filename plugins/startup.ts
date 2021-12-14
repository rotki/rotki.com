import { Plugin } from '@nuxt/types'
import { defineNuxtPlugin } from '@nuxtjs/composition-api'
import { useMainStore } from '~/store'

const startup: Plugin = defineNuxtPlugin(async ({ $pinia }) => {
  const { getAccount } = useMainStore($pinia)
  await getAccount()
})
export default startup
