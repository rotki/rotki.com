<script setup lang="ts">
const css = useCssModule();
</script>

<template>
  <div :class="css.content">
    <div :class="css.title">Your Plan</div>
    <div :class="css.body">
      <div :class="css.description">
        <slot />
      </div>
      <slot name="body" />
    </div>
  </div>
</template>

<style lang="scss" module>
.content {
  margin-top: 32px;
}

.body {
  @apply flex-row flex items-center;
}

.title {
  @apply text-rui-text;

  font-size: 18px;
  line-height: 21px;
  letter-spacing: 0;
}

.description {
  @apply text-rui-text;

  padding-top: 8px;
  font-size: 15px;
  line-height: 21px;
  opacity: 0.78;
  max-width: 280px;
}
</style>
