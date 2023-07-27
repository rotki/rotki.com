<script setup lang="ts">
withDefaults(
  defineProps<{
    selected: boolean;
    disabled?: boolean;
  }>(),
  {
    disabled: false,
  },
);

const emit = defineEmits<{ (e: 'click'): void }>();

const click = () => {
  emit('click');
};

const css = useCssModule();
</script>

<template>
  <button
    :class="{
      [css.button]: true,
      [css.selected]: selected,
    }"
    :disabled="disabled"
    @click="click()"
  >
    <span
      :class="{
        [css.text]: true,
        [css.selected]: selected,
      }"
    >
      <slot />
    </span>
  </button>
</template>

<style lang="scss" module>
.text {
  @apply font-bold;

  line-height: 19px;
  font-size: 16px;
  letter-spacing: 0;

  &:not(.selected) {
    @apply text-rui-primary;
  }

  &.selected {
    color: #fff;
  }
}

.button {
  background: 0 0 no-repeat padding-box;
  @apply relative overflow-hidden rounded-full py-1.5 px-4 border border-rui-primary;

  &::after {
    content: '';
    width: 200px;
    height: 200px;
    @apply absolute z-10 left-1/2 top-1/2 bg-black bg-opacity-10 transform -translate-x-1/2 -translate-y-1/2 transition-all duration-300 scale-0 rounded-full;
  }

  &:hover::after {
    @apply scale-100;
  }

  &:disabled {
    background-color: #f0f0f0 !important;
    border-color: #f0f0f0;

    & .text {
      color: #878787 !important;
    }

    @apply hover:scale-100;

    &::after {
      content: unset;
    }
  }

  &.selected {
    @apply hover:scale-100 bg-rui-primary;

    &::after {
      content: unset;
    }
  }

  &:focus {
    @apply outline-none text-rui-primary-lighter;
  }
}
</style>
