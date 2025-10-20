<template>
  <div :class="$style.content">
    <RuiCard>
      <div class="flex gap-4">
        <div class="flex flex-col flex-1">
          <div :class="$style.body">
            <div :class="$style.description">
              <slot />
            </div>
            <slot name="body" />
          </div>
        </div>
        <div class="flex items-center justify-center">
          <slot name="action" />
        </div>
      </div>
    </RuiCard>
  </div>
</template>

<style lang="scss" module>
.content {
  @apply mt-8;
}

.body {
  @apply flex-row flex items-center justify-between;
}

.title {
  @apply text-rui-text font-medium;
}

.description {
  @apply text-black/[0.54] text-body-2;
}
</style>
