import { Middleware } from '@nuxt/types'
import { useMainStore } from '~/store'

export default <Middleware>function ({ redirect }) {
  const { authenticated } = useMainStore()
  if (!authenticated) {
    return redirect('/login')
  }
}
