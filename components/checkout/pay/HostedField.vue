<script setup lang="ts">
withDefaults(
  defineProps<{
    id: string;
    label?: string;
    focused?: boolean;
    valid?: boolean;
    number?: boolean;
    empty?: boolean;
  }>(),
  {
    label: '',
    focused: false,
    valid: false,
    number: false,
    empty: false,
  },
);

const emit = defineEmits<{ (e: 'click'): void }>();
const css = useCssModule();
</script>

<template>
  <div
    :class="{
      [css.field]: true,
      [css.focused]: focused,
      [css.error]: !valid,
    }"
    @click="emit('click')"
  >
    <div
      :id="id"
      :class="{
        [css.input]: true,
        [css.focused]: focused,
        [css.empty]: empty,
        [css.error]: !valid,
      }"
    />
    <label :class="css.label" :for="id">{{ label }}</label>
    <span v-if="number" :class="css.append">
      <CardIcon :class="css.icon" />
    </span>
  </div>
</template>

<style lang="scss" module>
%floating {
  @apply transform scale-75 -translate-y-3.5 duration-300;
}

.input {
  @apply block w-full appearance-none focus:outline-none bg-transparent;

  padding: 0 16px;
  height: 56px;

  & ~ label {
    left: 8px;
    transform-origin: 0 0;
  }

  &.error ~ label {
    @apply text-rui-error;
  }

  &.focused ~ label {
    @extend %floating;
  }

  &.focused:not(.error) ~ label {
    @apply text-rui-primary-darker;
  }

  &:not(.empty):not(.focused) ~ label {
    @extend %floating;
  }

  &:not(.empty):not(.focused):not(.error) ~ label {
    @apply text-rui-text-secondary;
  }
}

.field {
  @apply relative;

  background: #f0f0f0 0 0 no-repeat padding-box;
  border-radius: 4px 4px 0 0;

  &.error {
    &::before,
    &::after {
      @apply bg-rui-error w-1/2;
    }
  }

  &::before,
  &::after {
    @apply absolute bottom-0 w-0 bg-rui-primary-darker transition-all ease-in-out;

    content: '';
    height: 2px;
  }

  &::before {
    @apply left-1/2;
  }

  &::after {
    @apply right-1/2;
  }

  &.focused::after,
  &.focused::before {
    @apply w-1/2;
  }
}

.label {
  @apply absolute top-3.5 text-rui-text-secondary;

  font-size: 16px;
  line-height: 24px;
  letter-spacing: 0.15px;
}

.icon {
  width: 24px;
  height: 24px;
}

.append {
  @apply absolute right-3.5 top-3.5;
}
</style>
