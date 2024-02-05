<script setup lang="ts">
const props = withDefaults(
  defineProps<{
    disabled?: boolean;
  }>(),
  {
    disabled: false,
  },
);

const emit = defineEmits<{
  (e: 'click'): void;
}>();

const { disabled } = toRefs(props);

function click() {
  if (disabled.value)
    return;

  emit('click');
}

const css = useCssModule();
</script>

<template>
  <div
    :class="{
      [css.btn]: true,
      [css.disabled]: disabled,
    }"
    @click="click()"
  >
    <slot />
  </div>
</template>

<style lang="scss" module>
.btn {
  padding: 2px;
}

.disabled {
  @apply text-gray-400;
}

.ripple {
  position: absolute;
  border-radius: 50%;
  transform: scale(0);
  animation: ripple 600ms linear;
  background-color: rgba(255, 255, 255, 0.7);
}
@keyframes ripple {
  to {
    transform: scale(4);
    opacity: 0;
  }
}
</style>
