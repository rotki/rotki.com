import { useContext } from '@nuxtjs/composition-api'

/**
 * Small utility to make the nuxt3 migration easier
 */
export const useRuntimeConfig = () => {
  const { $config } = useContext()
  return $config
}
