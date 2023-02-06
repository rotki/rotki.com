export const useOverflow = () => {
  const visible = ref(false)
  watch(visible, (visible) => {
    document.body.style.overflowY = visible ? 'hidden' : 'auto'
  })
  return { visible }
}
