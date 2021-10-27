<template>
  <svg
    :class="$style.icon"
    aria-hidden="true"
    height="1em"
    preserveAspectRatio="xMidYMid meet"
    role="img"
    viewBox="0 0 24 24"
    width="1em"
    xmlns="http://www.w3.org/2000/svg"
    v-on="$listeners"
  >
    <path
      d="M3 22l1.5-1.5L6 22l1.5-1.5L9 22l1.5-1.5L12 22l1.5-1.5L15 22l1.5-1.5L18 22l1.5-1.5L21 22V2l-1.5 1.5L18 2l-1.5 1.5L15 2l-1.5 1.5L12 2l-1.5 1.5L9 2L7.5 3.5L6 2L4.5 3.5L3 2m15 7H6V7h12m0 6H6v-2h12m0 6H6v-2h12v2z"
      fill="currentColor"
    />
  </svg>
</template>

<script lang="ts">
import { defineComponent } from '@nuxtjs/composition-api'

export default defineComponent({
  name: 'Receipt',
})
</script>

<style lang="scss" module>
.icon {
  width: 32px;
  height: 32px;
}
</style>
