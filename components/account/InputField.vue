<template>
  <div :class="$style.wrapper">
    <label v-if="label" :class="$style.label" :for="id"> {{ label }}</label>
    <select
      v-if="type === 'select'"
      :id="id"
      ref="inputField"
      v-model="selection"
      :class="$style.input"
      :disabled="disabled"
      @input="input($event)"
    >
      <option v-if="disabled" :class="$style.option" disabled selected>
        {{ selection }}
      </option>
      <option v-if="placeholder" :class="$style.option" disabled selected>
        {{ placeholder }}
      </option>
      <option
        v-for="country in items"
        :key="country.code"
        :class="$style.option"
        :value="country.code"
      >
        {{ country.name }}
      </option>
    </select>
    <input
      v-else
      :id="id"
      ref="inputField"
      :aria-describedby="`${id}-error`"
      :class="{
        [$style.input]: true,
        [$style.inputText]: true,
      }"
      :disabled="disabled"
      :placeholder="placeholder"
      :readonly="readonly"
      :type="type"
      :value="value"
      @input="input($event)"
      @keypress.enter="enter()"
    />

    <span
      v-if="errorMessages && errorMessages.length > 0"
      :id="`${id}-error`"
      :class="$style.error"
    >
      {{ errorMessages[0].$message }}
    </span>

    <span v-else :class="$style.caption">
      {{ hint }}
    </span>
    <slot />
  </div>
</template>

<script lang="ts">
import {
  defineComponent,
  onMounted,
  PropType,
  ref,
  toRef,
  watch,
} from '@nuxtjs/composition-api'
import { Country } from '~/composables/countries'

export default defineComponent({
  name: 'InputField',
  props: {
    id: {
      type: String,
      required: true,
    },
    value: {
      type: String,
      required: true,
    },
    type: {
      required: false,
      type: String,
      default: 'text',
    },
    label: {
      type: String,
      default: '',
      required: false,
    },
    hint: {
      type: String,
      default: '',
      required: false,
    },
    placeholder: {
      type: String,
      default: '',
      required: false,
    },
    errorMessages: {
      type: Array,
      default: () => [],
      required: false,
    },
    items: {
      type: Array as PropType<Country[]>,
      required: false,
      default: () => [],
    },
    readonly: {
      required: false,
      type: Boolean,
      default: false,
    },
    disabled: {
      required: false,
      type: Boolean,
      default: false,
    },
  },
  emits: ['input', 'enter'],
  setup(props, { emit }) {
    const selection = ref('')
    const inputField = ref<HTMLInputElement | null>(null)
    const input = (event: InputEvent) => {
      const target = event.target
      if (target) {
        emit('input', (target as HTMLInputElement).value ?? '')
      }
    }
    const value = toRef(props, 'value')
    if (props.type === 'select') {
      watch(selection, (newValue) => emit('input', newValue))
      onMounted(() => (selection.value = value.value))
    }

    const lastMessage = ref('')
    watch(toRef(props, 'errorMessages'), (value) => {
      if (
        value.length > 0 &&
        lastMessage.value !== (value[0] as any).$message
      ) {
        inputField.value?.focus()
        lastMessage.value = (value[0] as any).$message
      }
    })

    return {
      selection,
      inputField,
      input,
      enter: () => emit('enter'),
    }
  },
})
</script>

<style lang="scss" module>
@import '~assets/css/media';
@import '~assets/css/main';

.wrapper {
  @apply flex flex-col pt-2.5;
}

.input {
  @apply border-shade10 box-border border-solid focus:outline-none focus:border-primary py-2 px-3 appearance-none w-full bg-white;

  margin-top: 8px;
  border-width: 1px;
  border-radius: 8px;
  height: 48px;

  @include for-size(phone-only) {
    width: 100%;
  }
}

.input:disabled {
  @apply bg-gray-200;
}

.inputText:read-only {
  @apply bg-gray-50;
}

.caption {
  @apply text-xs font-sans;

  color: #808080;
  margin-top: 8px;
}

.error {
  color: #e53935;

  @extend .caption;
}

.label {
  @apply tracking-wide font-sans uppercase;

  font-weight: 600;

  @include text-size(14px, 20px);
}

.option {
  @apply py-2 px-2;
}
</style>
