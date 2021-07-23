import { ActionTree, MutationTree } from 'vuex'

export interface LoginCredentials {
  readonly username: string
  readonly password: string
}

enum Mutations {
  UPDATE_AUTHENTICATED = 'UPDATE_AUTHENTICATED',
}

export enum Actions {
  LOGIN = 'login',
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
}
