import { Middleware } from '@nuxt/types'
import { useMainStore } from '~/store'

export default <Middleware>function ({ redirect }) {
  const { account } = useMainStore()
  if (account && account.hasActiveSubscription) {
    const renewableSubscriptions = account.subscriptions.filter(({ actions }) =>
      actions.includes('renew')
    )

    if (!renewableSubscriptions) {
      return redirect('/home')
    }
  }
}
