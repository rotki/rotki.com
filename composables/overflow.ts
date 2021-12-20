import { ref, watch } from '@nuxtjs/composition-api'

export const setupOverflow = () => {
  const visible = ref(false)
  watch(visible, (visible) => {
    document.body.style.overflowY = visible ? 'hidden' : 'auto'
  })
  return { visible }
}
