import { Middleware } from '@nuxt/types'
import { useMainStore } from '~/store'

export default <Middleware>function ({ redirect }) {
  const { account } = useMainStore()
  if (account?.hasActiveSubscription) {
    return redirect('/home')
  }
}
