import { defineStore } from 'pinia'
import { ref } from '@nuxtjs/composition-api'
import {
  Account,
  ApiError,
  ApiKeys,
  ApiResponse,
  CancelSubscriptionResponse,
  CardCheckout,
  CardCheckoutResponse,
  ChangePasswordResponse,
  CryptoPayment,
  CryptoPaymentResponse,
  DeleteAccountResponse,
  PremiumData,
  PremiumResponse,
  Result,
  Subscription,
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
        assert(result)
        assert(account.value)
        account.value = {
          ...account.value,
          ...result,
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

  const cancelSubscription = async (subscription: Subscription) => {
    try {
      const response = await $api.delete<CancelSubscriptionResponse>(
        `/webapi/subscription/${subscription.identifier}`
      )
      const data = CancelSubscriptionResponse.parse(response.data)
      if (data.result) {
        await getAccount()
      } else {
        // TODO: handle error
      }
    } catch (e) {
      logger.error(e)
    }
  }

  const premium = async (): Promise<Result<PremiumData>> => {
    try {
      const response = await $api.get<PremiumResponse>('/webapi/premium')
      const data = PremiumResponse.parse(response.data)
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

  const pay = async (data: any) => {
    try {
      await $api.post<any>(
        '/webapi/payment/btr',
        axiosSnakeCaseTransformer(data)
      )
    } catch (e: any) {
      logger.error(e)
    }
    return null
  }

  const cryptoPayment = async (
    plan: number,
    currency: Currency
  ): Promise<Result<CryptoPayment>> => {
    try {
      const response = await $api.post<CryptoPaymentResponse>(
        '/webapi/payment/crypto',
        {
          currency,
          months: plan,
        },
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

  const logout = async (callApi: boolean = false) => {
    if (callApi) {
      try {
        await $api.post<UpdateProfileResponse>('/webapi/logout/')
      } catch (e) {
        logger.error(e)
      }
    }
    authenticated.value = false
    account.value = null
  }

  return {
    authenticated,
    account,
    login,
    getAccount,
    changePassword,
    updateKeys,
    updateProfile,
    deleteAccount,
    cancelSubscription,
    premium,
    checkout,
    pay,
    cryptoPayment,
    logout,
  }
})
