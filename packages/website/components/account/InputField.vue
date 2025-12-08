<script setup lang="ts">
import type { BaseErrorObject } from '~/types/common';
import { get, set } from '@vueuse/core';

const modelValue = defineModel<string>({ required: true });

const props = withDefaults(
  defineProps<{
    id: string;
    type?: string;
    label?: string;
    hint?: string;
    placeholder?: string;
    errorMessages?: BaseErrorObject[];
    autocomplete?: string;
    readonly?: boolean;
    disabled?: boolean;
    filled?: boolean;
  }>(),
  {
    type: 'text',
    label: '',
    hint: '',
    placeholder: '',
    errorMessages: () => [],
    autocomplete: undefined,
    readonly: false,
    disabled: false,
    filled: false,
  },
);

const emit = defineEmits<{
  enter: [];
  blur: [];
}>();

const inputField = ref<HTMLInputElement>();

function input(event: Event): void {
  const target = event.target;
  if (target)
    set(modelValue, (target as HTMLInputElement).value ?? '');
}

const lastMessage = ref<string>('');
watch(toRef(props, 'errorMessages'), (value) => {
  if (value.length > 0 && get(lastMessage) !== (value[0] as any).$message) {
    get(inputField)?.focus();
    set(lastMessage, (value[0] as any).$message);
  }
});

const isEmpty = computed<boolean>(() => {
  const currentValue = get(modelValue);
  return !currentValue || currentValue.trim().length === 0;
});

function blur(): void {
  emit('blur');
}

function enter(): void {
  emit('enter');
}
</script>

<template>
  <div :class="$style.wrapper">
    <div
      :class="{
        [$style.field]: true,
        [$style.filled]: filled,
        [$style['only-text']]: !$slots.prepend,
      }"
    >
      <div :class="$style.slot">
        <slot
          v-if="$slots.prepend"
          name="prepend"
        />
        <div :class="$style.inputContainer">
          <input
            :id="id"
            ref="inputField"
            :aria-describedby="`${id}-error`"
            :class="{
              [$style.input]: true,
              [$style.inputText]: true,
              [$style.filled]: filled,
              [$style.empty]: isEmpty,
            }"
            :disabled="disabled"
            :placeholder="placeholder"
            :readonly="readonly"
            :type="type"
            :value="modelValue"
            :autocomplete="autocomplete"
            @blur="blur()"
            @input="input($event)"
            @keypress.enter="enter()"
          />
          <label
            v-if="label"
            :class="$style.label"
            :for="id"
          >
            {{ label }}
          </label>
        </div>
        <slot
          v-if="$slots.append"
          name="append"
        />
      </div>
    </div>

    <span
      v-if="errorMessages && errorMessages.length > 0"
      :id="`${id}-error`"
      :class="$style.error"
    >
      {{ errorMessages[0].$message }}
    </span>

    <span
      v-else
      :class="$style.caption"
    >
      <slot name="hint">{{ hint }}</slot>
    </span>
    <slot />
  </div>
</template>

<style lang="scss" module>
@use '@/assets/css/media';
@use '@/assets/css/main';

.wrapper {
  @apply flex flex-col pt-2.5;
}

.input:not(.filled) {
  @apply block border-rui-grey-300 box-border border-solid focus:outline-none focus:border-rui-primary py-2 px-3 appearance-none w-full bg-white;

  margin-top: 8px;
  border-width: 1px;
  border-radius: 8px;
  height: 56px;

  & ~ label {
    @apply top-6;

    transform-origin: 0 0;
    left: 16px;
  }

  &:focus-within ~ label {
    @apply transform scale-75 -translate-y-4 text-rui-primary-darker duration-300;
  }

  &:not(.empty):not(:focus-within) ~ label {
    @apply transform scale-75 -translate-y-4 text-rui-text-secondary duration-300;
  }

  @include for-size(phone-only) {
    width: 100%;
  }
}

.input.filled {
  @apply block w-full appearance-none focus:outline-none bg-transparent px-2;

  height: 56px;

  & ~ label {
    left: 0;
  }

  &:focus-within ~ label {
    @apply transform scale-75 -translate-y-4 text-rui-primary-darker duration-300;
  }

  &:not(.empty):not(:focus-within) ~ label {
    @apply transform scale-75 -translate-y-4 text-rui-text-secondary duration-300;
  }
}

.slot {
  @apply flex flex-row;
}

.field.filled {
  @apply relative;

  background: #f0f0f0 0 0 no-repeat padding-box;
  border-radius: 4px 4px 0 0;

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

  &:focus-within::after,
  &:focus-within::before {
    @apply w-1/2;
  }
}

.inputContainer {
  @apply relative w-full;
}

.input:disabled {
  @apply bg-gray-200;
}

.inputText:read-only {
  @apply bg-gray-50;
}

%text-style {
  @apply text-xs font-sans;

  color: #808080;
  margin-top: 8px;
}

.caption {
  @extend %text-style;
}

.error {
  color: #e53935;

  @extend %text-style;
}

.label {
  @apply absolute top-4 text-rui-text-secondary text-sm;
}

.only-text label {
  @apply mx-2;
}
</style>
