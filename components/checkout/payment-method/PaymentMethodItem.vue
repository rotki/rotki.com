<template>
  <div
    :class="{
      [$style.content]: true,
      [$style.selected]: selected,
    }"
  >
    <div :class="$style.mark">
      <check-icon v-if="selected" :class="$style.check" />
    </div>

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

export default defineComponent({
  name: 'PaymentMethodItem',
  props: {
    selected: {
      required: true,
      type: Boolean,
    },
  },
})
</script>

<style lang="scss" module>
.content {
  @apply flex flex-col justify-center text-center items-center;

  width: 200px;
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

.mark {
  @apply flex flex-row justify-end;

  padding-right: 3px;
  height: 0;
  width: 100%;
}

.check {
  display: inline;
  margin-top: -18px;
  height: 24px;
  width: 24px;
}

.text {
  @apply font-bold font-sans mt-2;

  line-height: 28px;
  font-size: 24px;
  letter-spacing: 0;
  color: #212529;
}
</style>
