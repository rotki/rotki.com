<template>
  <div :class="$style.mark">
    <check-icon v-if="selected" :class="$style.check" :style="checkStyle" />
  </div>
</template>
<script lang="ts">
import { defineComponent, toRefs } from '@nuxtjs/composition-api'

export default defineComponent({
  name: 'CheckMark',
  props: {
    selected: {
      required: true,
      type: Boolean,
    },
    mt: {
      required: false,
      type: String,
      default: '-18px',
    },
  },
  setup(props) {
    const { mt } = toRefs(props)
    return {
      checkStyle: {
        'margin-top': mt.value,
      },
    }
  },
})
</script>
<style lang="scss" module>
.mark {
  @apply flex flex-row justify-end;

  padding-right: 3px;
  height: 0;
  width: 100%;
}

.check {
  display: inline;
  height: 24px;
  width: 24px;
}
</style>
