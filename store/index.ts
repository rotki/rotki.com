import { ActionTree, MutationTree } from 'vuex'
import {
  Account,
  ApiError,
  ApiKeys,
  ApiResponse,
  ChangePasswordResponse,
} from '~/types'
import { logger } from '~/utils/logger'

export interface LoginCredentials {
  readonly username: string
  readonly password: string
}

export interface PasswordChangePayload {
  readonly currentPassword: string
  readonly newPassword: string
  readonly passwordConfirmation: string
}

export type ActionResult = {
  readonly success: boolean
  readonly message?: ApiError
}

enum Mutations {
  UPDATE_AUTHENTICATED = 'UPDATE_AUTHENTICATED',
  ACCOUNT_DATA = 'ACCOUNT_DATA',
}

export enum Actions {
  LOGIN = 'login',
  ACCOUNT = 'account',
  UPDATE_KEYS = 'update_keys',
  CHANGE_PASSWORD = 'changePassword',
}

export const state = () => ({
  authenticated: false,
  account: null as Account | null,
})

export type RootState = ReturnType<typeof state>

export const mutations: MutationTree<RootState> = {
  [Mutations.UPDATE_AUTHENTICATED](state, authenticated: boolean) {
    state.authenticated = authenticated
  },
  [Mutations.ACCOUNT_DATA](state, account: Account) {
    state.account = account
  },
}

export const actions: ActionTree<RootState, RootState> = {
  async nuxtServerInit({ dispatch }) {
    await dispatch(Actions.ACCOUNT)
  },
  async [Actions.LOGIN](
    { commit, dispatch },
    { username, password }: LoginCredentials
  ): Promise<string> {
    try {
      const response = await this.$api.post(
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
        commit(Mutations.UPDATE_AUTHENTICATED, false)
        return response.data.message
      } else {
        await dispatch(Actions.ACCOUNT)
        commit(Mutations.UPDATE_AUTHENTICATED, true)
        return ''
      }
    } catch (e) {
      return e.message
    }
  },
  async [Actions.ACCOUNT]({ commit }) {
    try {
      const response = await this.$api.get<ApiResponse<Account>>(
        '/webapi/account/',
        {
          validateStatus: (status) => [200, 401].includes(status),
        }
      )

      if (response.status === 200) {
        commit(Mutations.UPDATE_AUTHENTICATED, true)
        commit(Mutations.ACCOUNT_DATA, Account.parse(response.data.result))
      }
    } catch (e) {
      logger.error(e)
    }
  },

  async [Actions.UPDATE_KEYS]({ commit, state }) {
    try {
      const response = await this.$api.patch<ApiResponse<ApiKeys>>(
        '/webapi/regenerate-keys/',
        {},
        {
          validateStatus: (status) => [200, 401].includes(status),
        }
      )
      if (response.status === 200) {
        const account = {
          ...state.account,
          ...ApiKeys.parse(response.data.result),
        }
        commit(Mutations.ACCOUNT_DATA, account)
      }
    } catch (e) {
      logger.error(e)
    }
  },
  async [Actions.CHANGE_PASSWORD](
    _,
    payload: PasswordChangePayload
  ): Promise<ActionResult> {
    try {
      const response = await this.$api.patch<ChangePasswordResponse>(
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
  },
}
