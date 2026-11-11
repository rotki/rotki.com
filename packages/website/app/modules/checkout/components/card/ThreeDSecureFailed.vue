<script setup lang="ts">
import type { ThreeDSecureFailure } from '~/modules/checkout/composables/use-three-d-secure';
import CheckoutPanel from '@rotki/checkout-ui/components/CheckoutPanel.vue';
import ButtonLink from '~/components/common/ButtonLink.vue';

const { failure, message, retryHref } = defineProps<{
  failure: ThreeDSecureFailure;
  /** What went wrong; shown for failed payments, where it can be the bank's own decline. */
  message: string;
  /** The card page for the same plan. */
  retryHref: string;
}>();

const { t } = useI18n({ useScope: 'global' });

const {
  public: {
    contact: { supportEmail, supportEmailMailto },
  },
} = useRuntimeConfig();
</script>

<template>
  <CheckoutPanel
    as="div"
    data-testid="three-d-secure-failed"
  >
    <div
      role="alert"
      class="flex flex-col gap-3"
    >
      <RuiIcon
        name="lu-circle-alert"
        size="40"
        color="error"
      />
      <p
        class="text-rui-text-secondary whitespace-break-spaces"
        data-testid="three-d-secure-error"
      >
        {{ failure === 'not-confirmed' ? t('subscription.3d_secure.not_confirmed.message') : message }}
      </p>
    </div>
    <ButtonLink
      :to="retryHref"
      variant="default"
      color="primary"
      size="lg"
      class="w-full sm:w-auto"
    >
      {{ t('subscription.3d_secure.try_again') }}
    </ButtonLink>
    <p class="text-sm text-rui-text-secondary pt-4 border-t border-rui-divider">
      <i18n-t
        keypath="subscription.3d_secure.help"
        tag="span"
      >
        <template #email>
          <a
            :href="supportEmailMailto"
            class="text-rui-primary underline"
            v-text="supportEmail"
          />
        </template>
      </i18n-t>
    </p>
  </CheckoutPanel>
</template>
