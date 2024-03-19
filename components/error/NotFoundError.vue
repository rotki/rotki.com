<script setup lang="ts">
defineProps<{ statusCode: number }>();

const emit = defineEmits<{ (e: 'handle-error'): void }>();

const { t } = useI18n();
const css = useCssModule();

const otherHeight = inject('otherHeight', 0);
</script>

<template>
  <div
    :class="[css.wrapper]"
  >
    <div class="flex flex-col gap-4">
      <h6 class="text-h6 text-rui-primary">
        {{ statusCode }}
      </h6>

      <h3 :class="css.heading">
        Page not found
      </h3>

      <p :class="css.description">
        You may have mis-typed the URL or the page has been removed. <br />
        Actually, there is nothing to see here...
      </p>

      <RuiButton
        class="self-center lg:self-start"
        variant="default"
        size="lg"
        filled
        color="primary"
        @click="emit('handle-error')"
      >
        {{ t('actions.go_back_home') }}
      </RuiButton>
    </div>

    <img
      :class="css.image"
      alt="rotki maintenance"
      src="/img/not-found.svg"
    />
  </div>
</template>

<style module lang="scss">
.wrapper {
  @apply w-full flex flex-col-reverse lg:flex-row gap-10 lg:gap-20 items-center justify-between;
  @apply text-center lg:text-left px-2 lg:px-4 py-4;
  min-height: calc(100vh - v-bind(otherHeight) * 1px);
}

.image {
  @apply w-1/3 lg:w-1/2 max-w-[40rem];
}

.link {
  @apply text-rui-primary hover:text-rui-primary-darker font-bold;
}

.heading {
  @apply text-h3 font-black text-rui-text;
}

.description {
  @apply text-black/60 text-body-1 py-2 mb-0;
}
</style>
