import { ActionTree, MutationTree } from 'vuex'
import { Account, ApiResponse } from '~/types'

export interface LoginCredentials {
  readonly username: string
  readonly password: string
}

enum Mutations {
  UPDATE_AUTHENTICATED = 'UPDATE_AUTHENTICATED',
}

export enum Actions {
  LOGIN = 'login',
  ACCOUNT = 'account',
}

export const state = () => ({
  authenticated: false,
})

export type RootState = ReturnType<typeof state>

export const mutations: MutationTree<RootState> = {
  [Mutations.UPDATE_AUTHENTICATED](state, authenticated: boolean) {
    state.authenticated = authenticated
  },
}

export const actions: ActionTree<RootState, RootState> = {
  async nuxtServerInit({ dispatch }) {
    await dispatch(Actions.ACCOUNT)
  },
  async [Actions.LOGIN](
    { commit },
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
      }
    } catch (e) {}
  },
}
