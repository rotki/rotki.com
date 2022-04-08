import { Middleware } from '@nuxt/types'

export default <Middleware>function ({ redirect, $config }) {
  if ($config.maintenance) {
    return redirect('/maintenance')
  }
}
