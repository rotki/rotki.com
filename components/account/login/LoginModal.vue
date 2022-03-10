<template>
  <modal-dialog :value="value" boxless @input="dismiss">
    <login-form modal @complete="dismiss" />
  </modal-dialog>
</template>

<script lang="ts">
import { defineComponent } from '@nuxtjs/composition-api'

export default defineComponent({
  name: 'LoginModal',
  props: {
    value: {
      required: true,
      type: Boolean,
    },
  },
  emits: ['input'],
  setup(_, { emit }) {
    const dismiss = () => {
      emit('input', false)
    }
    return {
      dismiss,
    }
  },
})
</script>
