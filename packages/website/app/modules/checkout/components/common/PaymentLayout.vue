<script setup lang="ts">
import type { CheckoutError } from '~/modules/checkout/composables/use-checkout';
import CheckoutDescription from '~/modules/checkout/components/common/CheckoutDescription.vue';
import CheckoutNotifications from '~/modules/checkout/components/common/CheckoutNotifications.vue';
import CheckoutTitle from '~/modules/checkout/components/common/CheckoutTitle.vue';

withDefaults(
  defineProps<{
    hideHeader?: boolean;
    error?: CheckoutError;
    loading?: boolean;
  }>(),
  {
    hideHeader: false,
    error: undefined,
    loading: false,
  },
);

const emit = defineEmits<{
  'clear-error': [];
}>();

defineSlots<{
  default: () => void;
  description?: () => void;
}>();

const { t } = useI18n({ useScope: 'global' });
</script>

<template>
  <div class="flex flex-col w-full grow">
    <div
      v-if="!hideHeader"
      class="mb-6"
    >
      <CheckoutTitle>
        {{ t('home.plans.tiers.step_3.title') }}
      </CheckoutTitle>
      <slot name="description">
        <CheckoutDescription>
          {{ t('home.plans.tiers.step_3.subtitle') }}
        </CheckoutDescription>
      </slot>
    </div>

    <slot />
  </div>

  <CheckoutNotifications
    :error="error"
    :loading="loading"
    @clear-error="emit('clear-error')"
  />
</template>
