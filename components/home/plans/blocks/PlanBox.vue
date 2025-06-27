<script setup lang="ts">
defineProps<{
  action: string;
  url?: string;
  buttonVariant?: 'filled' | 'outlined';
  recommended?: boolean;
}>();

const { t } = useI18n({ useScope: 'global' });
</script>

<template>
  <div class="flex flex-col h-full rounded border">
    <div class="flex flex-col gap-6 flex-1 py-6 px-8">
      <div class="flex justify-between items-start flex-wrap gap-2">
        <div>
          <h6 class="text-h6 text-rui-primary">
            <slot name="title" />
          </h6>
          <h4 class="text-h4">
            <slot name="price" />
          </h4>
        </div>

        <RuiChip v-if="recommended">
          {{ t('home.plans.details.recommended') }}
        </RuiChip>
      </div>
      <div class="text-body-1 text-rui-text-secondary">
        <slot />
      </div>
    </div>
    <div
      v-if="url"
      class="border-t py-6 px-8"
    >
      <ButtonLink
        :variant="buttonVariant"
        class="w-full"
        :to="url"
        size="lg"
        color="primary"
      >
        {{ action }}
      </ButtonLink>
    </div>
  </div>
</template>
