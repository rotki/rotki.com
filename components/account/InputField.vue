<script setup lang="ts">
const props = withDefaults(
  defineProps<{
    id: string;
    modelValue: string;
    type?: string;
    label?: string;
    hint?: string;
    placeholder?: string;
    errorMessages?: { $message: string }[];
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
    readonly: false,
    disabled: false,
    filled: false,
  }
);

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void;
  (e: 'enter'): void;
  (e: 'blur'): void;
}>();

const inputField = ref<HTMLInputElement | null>(null);
const input = (event: InputEvent) => {
  const target = event.target;
  if (target) {
    emit('update:modelValue', (target as HTMLInputElement).value ?? '');
  }
};
const value = toRef(props, 'modelValue');
const lastMessage = ref('');
watch(toRef(props, 'errorMessages'), (value) => {
  if (value.length > 0 && lastMessage.value !== (value[0] as any).$message) {
    inputField.value?.focus();
    lastMessage.value = (value[0] as any).$message;
  }
});

const isEmpty = computed(() => {
  const currentValue = value.value;
  return !currentValue || currentValue.trim().length === 0;
});

const blur = () => emit('blur');
const enter = () => emit('enter');

const css = useCssModule();
const slots = useSlots();
</script>

<template>
  <div :class="css.wrapper">
    <div
      :class="{
        [css.field]: true,
        [css.filled]: filled,
        [css['only-text']]: !slots.prepend,
      }"
    >
      <div :class="css.slot">
        <slot v-if="slots.prepend" name="prepend" />
        <div :class="css.inputContainer">
          <input
            :id="id"
            ref="inputField"
            :aria-describedby="`${id}-error`"
            :class="{
              [css.input]: true,
              [css.inputText]: true,
              [css.filled]: filled,
              [css.empty]: isEmpty,
            }"
            :disabled="disabled"
            :placeholder="placeholder"
            :readonly="readonly"
            :type="type"
            :value="value"
            @blur="blur()"
            @input="input($event)"
            @keypress.enter="enter()"
          />
          <label v-if="label" :class="css.label" :for="id"> {{ label }}</label>
        </div>
        <slot v-if="$slots.append" name="append" />
      </div>
    </div>

    <span
      v-if="errorMessages && errorMessages.length > 0"
      :id="`${id}-error`"
      :class="css.error"
    >
      {{ errorMessages[0].$message }}
    </span>

    <span v-else :class="css.caption">
      <slot name="hint">{{ hint }}</slot>
    </span>
    <slot />
  </div>
</template>

<style lang="scss" module>
@import '@/assets/css/media.scss';
@import '@/assets/css/main.scss';

.wrapper {
  @apply flex flex-col pt-2.5;
}

.input:not(.filled) {
  @apply block border-shade10 box-border border-solid focus:outline-none focus:border-primary py-2 px-3 appearance-none w-full bg-white;

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
    @apply transform scale-75 -translate-y-4 text-primary3 duration-300;
  }

  &:not(.empty):not(:focus-within) ~ label {
    @apply transform scale-75 -translate-y-4 text-label duration-300;
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
    @apply transform scale-75 -translate-y-4 text-primary3 duration-300;
  }

  &:not(.empty):not(:focus-within) ~ label {
    @apply transform scale-75 -translate-y-4 text-label duration-300;
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
    @apply absolute bottom-0 w-0 bg-primary3 transition-all ease-in-out;

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
  @apply font-sans absolute top-4 text-label text-sm;
}

.only-text label {
  @apply mx-2;
}
</style>
