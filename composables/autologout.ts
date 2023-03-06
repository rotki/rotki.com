import { storeToRefs } from 'pinia'
import { useMainStore } from '~/store'
import { logger } from '~/utils/logger'

export const useAutoLogout = () => {
  const store = useMainStore()
  const { authenticated } = storeToRefs(store)
  watch(authenticated, async (authenticated) => {
    if (!authenticated) {
      logger.debug('authentication lost, redirecting to login')
      await navigateTo('/login')
    }
  })
}
