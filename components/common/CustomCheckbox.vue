<template>
  <div :class="$style.checkbox">
    <input :id="id" :value="value" type="checkbox" @click="input(!value)" />
    <label :class="$style.label" :for="id">
      <slot></slot>
    </label>
  </div>
</template>
<script lang="ts">
import { defineComponent } from '@nuxtjs/composition-api'

export default defineComponent({
  name: 'CustomCheckbox',
  props: {
    value: {
      required: true,
      type: Boolean,
    },
    id: {
      required: false,
      type: String,
      default: '',
    },
  },
  emits: ['input'],
  setup(_, { emit }) {
    const input = (checked: boolean) => {
      emit('input', checked)
    }
    return {
      input,
    }
  },
})
</script>
<style lang="scss" module>
.checkbox {
  @apply flex flex-row items-center;

  font-size: 15px;
  line-height: 18px;
  margin-top: 16px;

  input {
    @apply text-primary3;
  }
}

.label {
  margin-left: 8px;
}
</style>
