<template>
  <button
    :class="{
      [$style.button]: true,
      [$style.selected]: selected,
    }"
    @click="click"
  >
    <span
      :class="{
        [$style.text]: true,
        [$style.selected]: selected,
      }"
    >
      <slot />
    </span>
  </button>
</template>

<script lang="ts">
import { defineComponent } from '@nuxtjs/composition-api'

export default defineComponent({
  name: 'SelectionButton',
  props: {
    selected: {
      required: true,
      type: Boolean,
    },
  },
  emits: ['click'],
  setup(_, { emit }) {
    const click = () => {
      emit('click')
    }
    return {
      click,
    }
  },
})
</script>

<style lang="scss" module>
$color: #da4e24;

.text {
  @apply font-sans font-bold;

  line-height: 19px;
  font-size: 16px;
  letter-spacing: 0;

  &:not(.selected) {
    color: $color;
  }

  &.selected {
    color: #fff;
  }
}

.button {
  background: 0 0 no-repeat padding-box;
  border-radius: 24px;
  padding: 6px 16px;
  border: 1px solid $color;

  &.selected {
    background-color: $color;
  }

  &:focus {
    @apply outline-none;

    color: rgba($color, 0.7);
  }
}
</style>
