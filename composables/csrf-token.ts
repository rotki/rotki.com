import { onMounted, useContext } from '@nuxtjs/composition-api'

export const setupCSRF = () => {
  const { $axios } = useContext()
  const getCSRFToken = async () => {
    await $axios.get('/webapi/csrf/')
  }
  onMounted(getCSRFToken)
}
