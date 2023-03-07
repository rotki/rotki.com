<script setup lang="ts">
defineProps<{ list: string[] }>();

const css = useCssModule();
</script>

<template>
  <div :class="css.wrapper">
    <ul :class="css.list">
      <li v-for="item in list" :key="item" :class="css.row">{{ item }}</li>
    </ul>
  </div>
</template>

<style lang="scss" module>
@import '@/assets/css/media.scss';
@import '@/assets/css/main.scss';

.wrapper {
  @apply flex flex-col;
}

.list {
  @apply font-sans font-light text-black;

  @include text-size(24px, 32px);
}

.list .row {
  display: flex;
  flex-direction: row;
}

.list li::before {
  @apply text-primary;

  margin-top: 12px;
  margin-right: 8px;
  content: '•';
  font-size: 38px;
  line-height: 8px;

  @include for-size(phone-only) {
    margin-top: 8px;
  }
}
</style>
