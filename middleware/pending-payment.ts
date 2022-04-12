import { Middleware } from '@nuxt/types'
import { useMainStore } from '~/store'

export default <Middleware>async function ({ redirect }) {
  const store = useMainStore()
  if (!store.account?.subscriptions) {
    return
  }

  const subscriptions = store.account.subscriptions
  const pending = subscriptions.filter(
    ({ actions, status }) => actions.includes('renew') || status === 'Pending'
  )

  if (pending.length > 0) {
    const { durationInMonths, identifier, status } = pending[0]
    const id = status === 'Pending' ? undefined : identifier
    const response = await store.checkPendingCryptoPayment(id)

    if (response.isError) {
      return
    }

    if (response.result.transactionStarted) {
      redirect('/home')
    } else if (response.result.pending) {
      const queryParams: { p: string; c: string; id?: string } = {
        p: durationInMonths.toString(),
        c: response.result.currency ?? '',
      }
      if (id) {
        queryParams.id = id
      }
      redirect('/checkout/pay/crypto', queryParams)
    }
  }
}
