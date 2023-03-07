<script setup lang="ts">
import { set } from '@vueuse/core';

const props = defineProps<{ value: string }>();

const { value } = toRefs(props);
const copied = ref(false);
const { start, stop } = useTimeoutFn(() => set(copied, false), 4000);
const { copy } = useClipboard({ source: value });

const copyToClipboard = () => {
  stop();
  copy();
  set(copied, true);
  start();
};

const css = useCssModule();
</script>

<template>
  <InfoTooltip>
    <template #activator>
      <button :class="css.button" @click="copyToClipboard">
        <Copy />
      </button>
    </template>

    <span v-if="copied">Copied to clipboard</span>
    <span v-else> Copy to clipboard </span>
  </InfoTooltip>
</template>

<style lang="scss" module>
.button {
  @apply hover:bg-shade1 rounded-2xl focus:outline-none;

  padding: 8px;
}

.ripple {
  position: absolute;
  border-radius: 50%;
  transform: scale(0);
  animation: ripple 600ms linear;
  background-color: rgba(255, 255, 255, 0.7);
}

@keyframes ripple {
  to {
    transform: scale(4);
    opacity: 0;
  }
}
</style>
