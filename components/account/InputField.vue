<template>
  <div :class="$style.wrapper">
    <label v-if="label" :for="id" :class="$style.label"> {{ label }}</label>
    <input
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
import Vue from 'vue'

export default Vue.extend({
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
  },
  data() {
    return {
      username: '',
    }
  },
  methods: {
    input(event: any) {
      this.$emit('input', event.value ?? '')
    },
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
  @apply border-shade10 box-border border-solid focus:outline-none focus:border-primary py-2 px-3 appearance-none w-full;

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
</style>
