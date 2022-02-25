import { Middleware } from '@nuxt/types'
import { useMainStore } from '~/store'
import { logger } from '~/utils/logger'

export default <Middleware>async function ({ redirect }) {
  const store = useMainStore()
  logger.debug(store.account)
  if (store.account?.subscriptions) {
    const subscriptions = store.account.subscriptions
    const pending = subscriptions.filter(
      ({ actions, status }) => actions.includes('renew') || status === 'Pending'
    )
    if (pending.length > 0) {
      const subscription = pending[0]
      const response = await store.checkPendingCryptoPayment(
        subscription.identifier
      )
      if (!response.isError && response.result.pending) {
        redirect('/checkout/pay/crypto', {
          p: subscription.durationInMonths.toString(),
          id: subscription.identifier,
          c: response.result.currency ?? '',
        })
      }
    }
  }
}
