<template>
  <div
    :class="{
      [$style.content]: true,
      [$style.selected]: selected,
    }"
    @click="click"
  >
    <check-mark :selected="selected" />

    <div :class="$style.icon">
      <slot />
    </div>
    <div :class="$style.text">
      <slot name="label"></slot>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from '@nuxtjs/composition-api'
import CheckMark from '~/components/checkout/payment-method/CheckMark.vue'

export default defineComponent({
  name: 'PaymentMethodItem',
  components: { CheckMark },
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
.content {
  @apply flex flex-col justify-center text-center items-center;

  width: 200px;
  min-width: 150px;
  height: 130px;
  background: 0 0 no-repeat padding-box;
  border: 1px solid;
  border-radius: 4px;

  &.selected {
    background-color: #fff;
    box-shadow: 0 4px 8px #0003;
    border-color: #da4e24;
  }

  &:not(.selected) {
    background-color: #f0f0f0;
    border-color: #d2d2d2;
  }
}

.icon {
  width: 48px;
  height: 48px;
}

.text {
  @apply font-bold font-sans mt-2;

  line-height: 28px;
  font-size: 24px;
  letter-spacing: 0;
  color: #212529;
}
</style>
