import { computed, useRoute } from '@nuxtjs/composition-api'

const availablePlans = [1, 3, 6, 12]
export const supportedCurrencies = ['ETH', 'BTC', 'DAI'] as const
export type Currency = typeof supportedCurrencies[number]
type CurrencyParam = Currency | null

export const setupPlanParams = () => {
  const route = useRoute()
  const plan = computed(() => {
    const plan = route.value.query.p
    if (typeof plan !== 'string') {
      return -1
    }
    const selectedPlan = parseInt(plan)
    if (
      isNaN(selectedPlan) ||
      !isFinite(selectedPlan) ||
      !availablePlans.includes(selectedPlan)
    ) {
      return -1
    }
    return selectedPlan
  })

  return { plan }
}

export const setupCurrencyParams = () => {
  const route = useRoute()
  const currency = computed<CurrencyParam>(() => {
    const currency = route.value.query.c
    if (
      typeof currency !== 'string' ||
      !supportedCurrencies.includes(currency as any)
    ) {
      return null
    }
    return currency as Currency
  })

  return { currency }
}
