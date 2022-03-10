import { Middleware } from '@nuxt/types'
import { useMainStore } from '~/store'

export default <Middleware>async function ({ redirect }) {
  const store = useMainStore()
  if (store.account?.subscriptions) {
    const subscriptions = store.account.subscriptions
    const pending = subscriptions.filter(
      ({ actions, status }) => actions.includes('renew') || status === 'Pending'
    )
    if (pending.length > 0) {
      const subscription = pending[0]
      const identifier =
        subscription.status === 'Pending' ? undefined : subscription.identifier
      const response = await store.checkPendingCryptoPayment(identifier)
      if (!response.isError && response.result.pending) {
        const queryParams: { p: string; c: string; id?: string } = {
          p: subscription.durationInMonths.toString(),
          c: response.result.currency ?? '',
        }
        if (identifier) {
          queryParams.id = identifier
        }
        redirect('/checkout/pay/crypto', queryParams)
      }
    }
  }
}
