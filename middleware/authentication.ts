import { Middleware } from '@nuxt/types'

const myMiddleware: Middleware = ({ store, redirect }) => {
  if (!store.state.authenticated) {
    return redirect('/login')
  }
}

export default myMiddleware
