import {
  computed,
  onBeforeMount,
  ref,
  useRoute,
  useRouter,
  watch,
} from '@nuxtjs/composition-api'
import { get, set } from '@vueuse/core'
import { useMainStore } from '~/store'
import { CardCheckout, SelectedPlan } from '~/types'

export const setupBraintree = () => {
  const store = useMainStore()
  const route = useRoute()
  const router = useRouter()
  const checkout = ref<CardCheckout | null>(null)

  watch(route, async (route) => await loadPlan(route.query.p as string))

  async function loadPlan(months: string) {
    const plan = parseInt(months)
    const data = await store.checkout(plan)
    if (data.isError) {
      router.back()
    } else {
      set(checkout, data.result)
    }
  }

  onBeforeMount(async () => {
    await loadPlan(get(route).query.p as string)
  })

  const plan = computed<SelectedPlan | null>(() => {
    const payload = get(checkout)
    if (!payload) {
      return null
    }
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { braintreeClientToken, ...data } = payload
    return data
  })

  const token = computed(() => {
    const payload = get(checkout)
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
