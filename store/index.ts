import { defineStore } from 'pinia'
import { ref } from '@nuxtjs/composition-api'
import { get, set, useTimeoutFn } from '@vueuse/core'
import {
  Account,
  ApiError,
  ApiKeys,
  ApiResponse,
  CancelSubscriptionResponse,
  CardCheckout,
  CardCheckoutResponse,
  CardPaymentRequest,
  ChangePasswordResponse,
  CryptoPayment,
  CryptoPaymentResponse,
  DeleteAccountResponse,
  PendingCryptoPayment,
  PendingCryptoPaymentResponse,
  PendingCryptoPaymentResultResponse,
  Plan,
  PremiumResponse,
  Result,
  Subscription,
  SubStatus,
  UpdateProfileResponse,
} from '~/types'
import { logger } from '~/utils/logger'
import { axiosSnakeCaseTransformer, useApi } from '~/plugins/axios'
import { assert } from '~/utils/assert'
import { Currency } from '~/composables/plan'

export interface LoginCredentials {
  readonly username: string
  readonly password: string
}

export interface PasswordChangePayload {
  readonly currentPassword: string
  readonly newPassword: string
  readonly passwordConfirmation: string
}

export interface ProfilePayload {
  readonly githubUsername: string
  readonly firstName?: string
  readonly lastName?: string
  readonly companyName?: string
  readonly vatId?: string
  readonly address1?: string
  readonly address2?: string
  readonly city?: string
  readonly postcode?: string
  readonly country?: string
}

export type DeleteAccountPayload = {
  username: string
}

export type ActionResult = {
  readonly success: boolean
  readonly message?: ApiError
}

export const useMainStore = defineStore('main', () => {
  const authenticated = ref(false)
  const account = ref<Account | null>(null)
  const plans = ref<Plan[] | null>(null)
  const cancellationError = ref('')
  const $api = useApi()

  const getAccount = async () => {
    try {
      const response = await $api.get<ApiResponse<Account>>(
        '/webapi/account/',
        {
          validateStatus: (status) => [200, 401].includes(status),
        }
      )

      if (response.status === 200) {
        authenticated.value = true
        account.value = Account.parse(response.data.result)
      }
    } catch (e) {
      logger.error(e)
    }
  }

  const login = async ({
    username,
    password,
  }: LoginCredentials): Promise<string> => {
    try {
      const response = await $api.post(
        '/webapi/login/',
        {
          username,
          password,
        },
        {
          withCredentials: true,
          validateStatus: (status) => [200, 400].includes(status),
        }
      )
      if (response.status === 400) {
        authenticated.value = false
        return response.data.message
      } else {
        await getAccount()
        authenticated.value = true
        return ''
      }
    } catch (e: any) {
      return e.message
    }
  }

  const updateKeys = async () => {
    try {
      const response = await $api.patch<ApiResponse<ApiKeys>>(
        '/webapi/regenerate-keys/',
        {},
        {
          validateStatus: (status) => [200, 401].includes(status),
        }
      )
      if (response.status === 200) {
        assert(account.value)
        account.value = {
          ...account.value,
          ...ApiKeys.parse(response.data.result),
        }
      }
    } catch (e) {
      logger.error(e)
    }
  }

  const changePassword = async (
    payload: PasswordChangePayload
  ): Promise<ActionResult> => {
    try {
      const response = await $api.patch<ChangePasswordResponse>(
        '/webapi/change-password/',
        payload,
        {
          validateStatus: (status) => [200, 400].includes(status),
        }
      )
      const data = ChangePasswordResponse.parse(response.data)
      if (response.status === 200) {
        return {
          success: data.result ?? false,
          message: '',
        }
      } else {
        return {
          success: false,
          message: data.message,
        }
      }
    } catch (e: any) {
      logger.error(e)
      return {
        success: false,
        message: e.message,
      }
    }
  }

  const updateProfile = async (
    payload: ProfilePayload
  ): Promise<ActionResult> => {
    try {
      const response = await $api.patch<UpdateProfileResponse>(
        '/webapi/account/',
        payload,
        {
          validateStatus: (status) => [200, 400].includes(status),
        }
      )

      const { result, message } = UpdateProfileResponse.parse(response.data)
      if (response.status === 200) {
        const country = get(account)?.address?.country ?? ''
        assert(result)
        assert(account.value)
        account.value = {
          ...account.value,
          ...result,
        }
        if (payload.country !== country) {
          await getAccount()
        }
        return { success: true }
      } else {
        assert(message)
        return {
          success: false,
          message,
        }
      }
    } catch (e: any) {
      logger.error(e)
      return {
        success: false,
        message: e.message,
      }
    }
  }

  const deleteAccount = async (
    payload: DeleteAccountPayload
  ): Promise<ActionResult> => {
    try {
      const response = await $api.delete<DeleteAccountResponse>(
        '/webapi/account/',

        {
          data: payload,
          validateStatus: (status) => [200, 400].includes(status),
        }
      )

      const data = DeleteAccountResponse.parse(response.data)
      return {
        success: data.result ?? false,
        message: data.message,
      }
    } catch (e: any) {
      logger.error(e)
      return {
        success: false,
        message: e.message,
      }
    }
  }

  const { stop, start } = useTimeoutFn(() => set(cancellationError, ''), 7000)

  const cancelSubscription = async (subscription: Subscription) => {
    const acc = get(account)
    assert(acc)
    const subscriptions = [...acc.subscriptions]
    const subIndex = subscriptions.findIndex(
      (sub) => sub.identifier === subscription.identifier
    )
    const sub = subscriptions[subIndex]
    const { actions, status, nextActionDate } = sub
    function updateSub(
      actions: string[],
      status: SubStatus,
      nextActionDate: string
    ) {
      sub.actions = actions
      sub.status = status
      sub.nextActionDate = nextActionDate
      assert(acc)
      set(account, {
        ...acc,
        subscriptions,
      })
    }

    try {
      updateSub([], 'Cancelled', 'Never')
      const response = await $api.delete<CancelSubscriptionResponse>(
        `/webapi/subscription/${subscription.identifier}`,
        {
          validateStatus: (status) => [200, 404].includes(status),
        }
      )
      const data = CancelSubscriptionResponse.parse(response.data)
      if (data.result) {
        await getAccount()
      } else {
        updateSub(actions, status, nextActionDate)
        logger.error(data.message)
        stop()
        set(cancellationError, data.message)
        start()
      }
    } catch (e: any) {
      updateSub(actions, status, nextActionDate)
      logger.error(e)
      stop()
      set(cancellationError, e.message)
      start()
    }
  }

  const getPlans = async (): Promise<void> => {
    if (get(plans)) {
      logger.debug('plans already loaded')
      return
    }

    try {
      const response = await $api.get<PremiumResponse>('/webapi/premium')
      const data = PremiumResponse.parse(response.data)
      set(plans, data.result.plans)
    } catch (e: any) {
      logger.error(e)
    }
  }

  const checkout = async (plan: number): Promise<Result<CardCheckout>> => {
    try {
      const response = await $api.get<CardCheckoutResponse>(
        `/webapi/checkout/card/${plan}`
      )
      const data = CardCheckoutResponse.parse(response.data)
      return {
        isError: false,
        result: data.result,
      }
    } catch (e: any) {
      logger.error(e)
      return {
        isError: true,
        error: e,
      }
    }
  }

  const pay = async (data: CardPaymentRequest): Promise<Result<true>> => {
    try {
      await $api.post<any>(
        '/webapi/payment/btr',
        axiosSnakeCaseTransformer(data)
      )
      getAccount().then()
      return {
        isError: false,
        result: true,
      }
    } catch (e: any) {
      logger.error(e)
      return {
        isError: true,
        error: e,
      }
    }
  }

  const cryptoPayment = async (
    plan: number,
    currency: Currency,
    subscriptionId?: string
  ): Promise<Result<CryptoPayment>> => {
    try {
      const response = await $api.post<CryptoPaymentResponse>(
        '/webapi/payment/crypto',
        axiosSnakeCaseTransformer({
          currency,
          months: plan,
          subscriptionId,
        }),
        {
          validateStatus: (status) => [200, 400].includes(status),
        }
      )

      const { result, message } = CryptoPaymentResponse.parse(response.data)
      if (result) {
        return {
          result,
          isError: false,
        }
      } else {
        return {
          error: new Error(message?.toString()),
          isError: true,
        }
      }
    } catch (e: any) {
      logger.error(e)
      return {
        error: e,
        isError: true,
      }
    }
  }

  const checkPendingCryptoPayment = async (
    subscriptionId?: string
  ): Promise<Result<PendingCryptoPayment>> => {
    try {
      const response = await $api.get<PendingCryptoPaymentResponse>(
        'webapi/payment/pending',
        {
          params: axiosSnakeCaseTransformer({ subscriptionId }),
        }
      )
      const data = PendingCryptoPaymentResponse.parse(response.data)
      if (data.result) {
        return {
          result: data.result,
          isError: false,
        }
      } else {
        return {
          error: new Error(data.message),
          isError: true,
        }
      }
    } catch (e: any) {
      logger.error(e)
      return {
        error: e,
        isError: true,
      }
    }
  }

  const markTransactionStarted = async (): Promise<Result<boolean>> => {
    try {
      const response = await $api.patch<PendingCryptoPaymentResultResponse>(
        'webapi/payment/pending'
      )
      const data = PendingCryptoPaymentResultResponse.parse(response.data)
      if (data.result) {
        return {
          result: data.result,
          isError: false,
        }
      } else {
        return {
          error: new Error(data.message),
          isError: true,
        }
      }
    } catch (e: any) {
      logger.error(e)
      return {
        error: e,
        isError: true,
      }
    }
  }

  const switchCryptoPlan = async (
    plan: number,
    currency: Currency
  ): Promise<Result<CryptoPayment>> => {
    try {
      const response = await $api.delete<PendingCryptoPaymentResultResponse>(
        'webapi/payment/pending'
      )
      const data = PendingCryptoPaymentResultResponse.parse(response.data)
      if (data.result) {
        const payment = await cryptoPayment(plan, currency)
        if (payment.isError) {
          return payment
        }
        return {
          isError: false,
          result: payment.result,
        }
      } else {
        return {
          error: Error(data.message),
          isError: true,
        }
      }
    } catch (e: any) {
      logger.error(e)
      return {
        error: e,
        isError: true,
      }
    }
  }

  const logout = async (callApi: boolean = false) => {
    if (callApi) {
      try {
        await $api.post<UpdateProfileResponse>('/webapi/logout/')
      } catch (e) {
        logger.error(e)
      }
    }
    set(authenticated, false)
    set(account, null)
  }

  return {
    authenticated,
    account,
    plans,
    cancellationError,
    login,
    getAccount,
    changePassword,
    updateKeys,
    updateProfile,
    deleteAccount,
    cancelSubscription,
    getPlans,
    checkout,
    pay,
    cryptoPayment,
    checkPendingCryptoPayment,
    switchCryptoPlan,
    markTransactionStarted,
    logout,
  }
})
