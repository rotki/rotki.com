<script setup lang="ts">
defineProps<{ visible: boolean }>();

const css = useCssModule();
</script>

<template>
  <Transition name="fade">
    <NotificationMessage v-if="visible">
      <div :class="css.icon">
        <ErrorIcon />
      </div>
      <div :class="css.errorText">
        <div :class="css.errorTitle">
          <slot name="title" />
        </div>
        <div :class="css.errorDescription">
          <slot name="description" />
        </div>
      </div>
    </NotificationMessage>
  </Transition>
</template>

<style lang="scss" module>
.icon {
  @apply flex items-center;
}

.errorText {
  @apply ml-2;
}

.errorTitle {
  @apply font-sans font-bold;
}

.errorDescription {
  @apply font-sans text-shade11;
}
</style>
