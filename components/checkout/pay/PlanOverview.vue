<script setup lang="ts">
const { t } = useI18n();
</script>

<template>
  <div :class="$style.content">
    <RuiCard>
      <div class="flex gap-4">
        <div class="flex flex-col">
          <div :class="$style.title">
            {{ t('home.plans.tiers.step_3.chose') }}
          </div>
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
  @apply text-rui-text text-h6;
}

.description {
  @apply text-black/[0.54] text-body-2;
}
</style>
