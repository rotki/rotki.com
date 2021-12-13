import { Middleware } from '@nuxt/types'
import { useMainStore } from '~/store'

const myMiddleware: Middleware = ({ redirect }) => {
  const { authenticated } = useMainStore()
  if (!authenticated) {
    return redirect('/login')
  }
}

export default myMiddleware
