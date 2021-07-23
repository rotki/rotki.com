<template>
  <div :class="$style.wrapper">
    <label v-if="label" :for="id" :class="$style.label"> {{ label }}</label>
    <select
      v-if="type === 'select'"
      :id="id"
      v-model="selection"
      :class="$style.input"
      @input="input($event)"
    >
      <option v-if="placeholder" selected disabled :class="$style.option">
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
      :value="value"
      :type="type"
      :class="$style.input"
      :placeholder="placeholder"
      @input="input($event)"
    />

    <span :class="$style.caption">
      {{ hint }}
    </span>
    <slot />
  </div>
</template>

<script lang="ts">
import { defineComponent, PropType, ref, watch } from '@nuxtjs/composition-api'
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
    items: {
      type: Array as PropType<Country[]>,
      required: false,
      default: () => [],
    },
  },
  setup(props, { emit }) {
    const selection = ref('')
    const input = (event: InputEvent) => {
      emit('input', event.target?.value ?? '')
    }
    if (props.type === 'select') {
      watch(selection, (newValue) => emit('input', newValue))
    }

    return {
      selection,
      input,
    }
  },
})
</script>

<style scoped module lang="scss">
@import '~assets/css/media';
@import '~assets/css/main';

.wrapper {
  @apply flex flex-col;
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

.caption {
  @apply text-xs font-sans;

  color: #808080;
  margin-top: 8px;
}

.label {
  @apply tracking-wide font-serif font-medium uppercase;

  @include text-size(14px, 20px);
}

.option {
  @apply py-2 px-2;
}
</style>
