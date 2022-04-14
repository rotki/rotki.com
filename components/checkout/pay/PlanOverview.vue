<template>
  <div :class="$style.content">
    <div :class="$style.title">Your Plan</div>
    <div :class="$style.body">
      <div :class="$style.description">
        <slot />
      </div>
      <slot name="body" />
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from '@nuxtjs/composition-api'

export default defineComponent({
  name: 'PlanOverview',
})
</script>

<style lang="scss" module>
.content {
  margin-top: 32px;
}

.body {
  @apply flex-row flex items-center;
}

.title {
  @apply text-typography;

  font-size: 18px;
  line-height: 21px;
  letter-spacing: 0;
}

.description {
  @apply text-typography;

  padding-top: 8px;
  font-size: 15px;
  line-height: 21px;
  opacity: 0.78;
  max-width: 280px;
}
</style>
