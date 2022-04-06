import { Middleware } from '@nuxt/types'

export default <Middleware>function ({ redirect }) {
  const isOnMaintenanceMode = process.env.maintenance === 'true'
  if (isOnMaintenanceMode) {
    return redirect('/maintenance')
  }
}
