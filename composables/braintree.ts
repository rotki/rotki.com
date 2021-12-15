import {
  computed,
  onBeforeMount,
  ref,
  useRoute,
  useRouter,
} from '@nuxtjs/composition-api'
import { useMainStore } from '~/store'
import { CardCheckout, SelectedPlan } from '~/types'

export const setupBraintree = () => {
  const store = useMainStore()
  const route = useRoute()
  const router = useRouter()
  const checkout = ref<CardCheckout | null>(null)

  onBeforeMount(async () => {
    const plan = parseInt(route.value.query.p as string)
    const data = await store.checkout(plan)
    if (data.isError) {
      router.back()
    } else {
      checkout.value = data.result
    }
  })

  const plan = computed<SelectedPlan | null>(() => {
    const payload = checkout.value
    if (!payload) {
      return null
    }
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { braintreeClientToken, ...data } = payload
    return data
  })

  const token = computed(() => {
    const payload = checkout.value
    if (!payload) {
      return ''
    }
    return payload.braintreeClientToken
  })

  const submit = async ({
    months,
    nonce,
  }: {
    months: number
    nonce: string
  }) => {
    await store.pay({
      months,
      paymentMethodNonce: nonce,
    })
  }
  return {
    plan,
    token,
    submit,
  }
}
