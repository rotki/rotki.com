<script setup lang="ts">
import { get } from '@vueuse/core';

const props = defineProps<{
  action: string;
  url?: string;
}>();

const emit = defineEmits<{ (e: 'click'): void }>();

const { url } = toRefs(props);

const buttonClicked = () => {
  const targetUrl = get(url);
  if (targetUrl) {
    navigateTo(targetUrl);
  } else {
    emit('click');
  }
};

const css = useCssModule();
</script>

<template>
  <div :class="css.plan">
    <div :class="css.title">
      <slot name="title" />
    </div>
    <div :class="css.description">
      <slot />
      <div :class="css.button" class="flex justify-center">
        <RuiButton
          variant="outlined"
          size="lg"
          class="!py-4 !px-10 !text-xl uppercase outline-2"
          rounded
          color="primary"
          @click="buttonClicked()"
        >
          {{ action }}
        </RuiButton>
      </div>
    </div>
  </div>
</template>

<style lang="scss" module>
@import '@/assets/css/main.scss';
@import '@/assets/css/media.scss';

.plan {
  @apply flex flex-col col-span-12 md:col-span-4 flex-shrink;

  margin-top: 93px;

  @include for-size(phone-only) {
    padding-right: $mobile-margin;
    padding-left: $mobile-margin;
  }
}

.title {
  @apply font-bold text-rui-text text-center;

  letter-spacing: -0.01em;

  @include text-size(32px, 47px);
}

.description {
  @apply text-center text-rui-text flex flex-col self-center;

  margin-top: 45px;
  max-width: 370px;
  height: 100%;

  @include text-size(24px, 32px);
}

.button {
  margin-top: 75px;
}
</style>
