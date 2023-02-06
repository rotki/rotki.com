<template>
  <div
    :class="{
      [css.content]: true,
      [css.selected]: selected,
    }"
    @click="emit('click')"
  >
    <CheckMark :selected="selected" />

    <div :class="css.icon">
      <slot />
    </div>
    <div :class="css.text">
      <slot name="label"></slot>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{ selected: boolean }>()

const emit = defineEmits<{ (e: 'click'): void }>()

const css = useCssModule()
</script>

<style lang="scss" module>
.content {
  @apply flex flex-col justify-center text-center items-center cursor-pointer;

  width: 200px;
  min-width: 150px;
  height: 130px;
  background: 0 0 no-repeat padding-box;
  border: 1px solid;
  border-radius: 4px;

  &.selected {
    background-color: #fff;
    box-shadow: 0 4px 8px #0003;
    border-color: #da4e24;
  }

  &:not(.selected) {
    background-color: #f0f0f0;
    border-color: #d2d2d2;
  }
}

.icon {
  width: 48px;
  height: 48px;
}

.text {
  @apply font-bold font-sans mt-2;

  line-height: 28px;
  font-size: 24px;
  letter-spacing: 0;
  color: #212529;
}
</style>
