import { ActionTree, MutationTree } from 'vuex'
import { Account, ApiKeys, ApiResponse } from '~/types'

export interface LoginCredentials {
  readonly username: string
  readonly password: string
}

enum Mutations {
  UPDATE_AUTHENTICATED = 'UPDATE_AUTHENTICATED',
  ACCOUNT_DATA = 'ACCOUNT_DATA',
}

export enum Actions {
  LOGIN = 'login',
  ACCOUNT = 'account',
  UPDATE_KEYS = 'update_keys',
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
        commit(Mutations.ACCOUNT_DATA, response.data.result)
      }
    } catch (e) {}
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
        const account = { ...state.account, ...response.data.result }
        commit(Mutations.ACCOUNT_DATA, account)
      }
    } catch (e) {}
  },
}
