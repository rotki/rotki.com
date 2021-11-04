<template>
  <div
    :class="{
      [$style.field]: true,
      [$style.focused]: focused,
      [$style.error]: !valid,
    }"
    @click="click"
  >
    <div
      :id="id"
      :class="{
        [$style.input]: true,
        [$style.focused]: focused,
        [$style.empty]: empty,
        [$style.error]: !valid,
      }"
    />
    <label :class="$style.label" :for="id">{{ label }}</label>
    <span v-if="number" :class="$style.append">
      <card-icon :class="$style.icon" />
    </span>
  </div>
</template>

<script lang="ts">
import { defineComponent } from '@nuxtjs/composition-api'

export default defineComponent({
  name: 'HostedField',
  props: {
    id: {
      required: true,
      type: String,
    },
    label: {
      required: false,
      type: String,
      default: '',
    },
    focused: {
      required: false,
      type: Boolean,
      default: false,
    },
    valid: {
      required: false,
      type: Boolean,
      default: false,
    },
    number: {
      required: false,
      type: Boolean,
      default: false,
    },
    empty: {
      required: false,
      type: Boolean,
      default: false,
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
.floating {
  @apply transform scale-75 -translate-y-3.5 duration-300;
}

.input {
  @apply block w-full appearance-none focus:outline-none bg-transparent;

  padding: 0 16px;
  height: 56px;

  & ~ label {
    left: 8px;
    transform-origin: 0 0;
  }

  &.error ~ label {
    @apply text-error;
  }

  &.focused ~ label {
    @extend .floating;
  }

  &.focused:not(.error) ~ label {
    @apply text-primary3;
  }

  &:not(.empty):not(.focused) ~ label {
    @extend .floating;
  }

  &:not(.empty):not(.focused):not(.error) ~ label {
    @apply text-label;
  }
}

.field {
  @apply relative;

  background: #f0f0f0 0 0 no-repeat padding-box;
  border-radius: 4px 4px 0 0;

  &.error {
    &::before,
    &::after {
      @apply bg-error w-1/2;
    }
  }

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

  &.focused::after,
  &.focused::before {
    @apply w-1/2;
  }
}

.label {
  @apply font-sans absolute top-3.5 text-label;

  font-size: 16px;
  line-height: 24px;
  letter-spacing: 0.15px;
}

.icon {
  width: 24px;
  height: 24px;
}

.append {
  @apply absolute right-3.5 top-3.5;
}
</style>
