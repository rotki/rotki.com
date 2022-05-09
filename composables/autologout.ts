import { storeToRefs } from 'pinia'
import { useRouter, watch } from '@nuxtjs/composition-api'
import { useMainStore } from '~/store'
import { logger } from '~/utils/logger'

export const useAutoLogout = () => {
  const router = useRouter()
  const store = useMainStore()
  const { authenticated } = storeToRefs(store)
  watch(authenticated, (authenticated) => {
    if (!authenticated) {
      logger.debug('authentication lost, redirecting to login')
      router.push('/login')
    }
  })
}
