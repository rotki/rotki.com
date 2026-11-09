<script setup lang="ts">
import { formatEur } from '@rotki/card-payment-common/utils/money';
import PaymentPage from '@rotki/checkout-ui/components/PaymentPage.vue';
import { get } from '@vueuse/shared';
import ButtonLink from '~/components/common/ButtonLink.vue';
import { usePageSeoNoIndex } from '~/composables/use-page-seo';
import ThreeDSecureFailed from '~/modules/checkout/components/card/ThreeDSecureFailed.vue';
import ThreeDSecureSummary from '~/modules/checkout/components/card/ThreeDSecureSummary.vue';
import ServerErrorOverlay from '~/modules/checkout/components/common/ServerErrorOverlay.vue';
import { useThreeDSecure } from '~/modules/checkout/composables/use-three-d-secure';
import { buildQueryParams } from '~/utils/query';

definePageMeta({
  auth: true,
  layout: 'checkout',
  requiresSubscriber: true,
  requiresVerified: true,
});

const { t } = useI18n({ useScope: 'global' });

usePageSeoNoIndex('3D Secure Verification');

const {
  state,
  error,
  failure,
  challengeVisible,
  isProcessing,
  serverError,
  params,
  initializeProcess,
  cleanup,
  clearStoredData,
} = useThreeDSecure();

/** The card page for the same plan, code and upgrade. */
const retryHref = computed<string>(() => {
  const payment = get(params);
  if (!payment)
    return '/checkout/pay';
  const query = new URLSearchParams(buildQueryParams({
    planId: payment.planId,
    discountCode: payment.discountCode,
    upgradeSubId: payment.upgradeSubId,
  }));
  return `/checkout/pay/card?${query.toString()}`;
});

const title = computed<string>(() => {
  if (!get(params))
    return t('subscription.3d_secure.expired.title');
  const failed = get(failure);
  if (failed === 'not-confirmed')
    return t('subscription.3d_secure.not_confirmed.title');
  if (failed === 'payment')
    return t('subscription.3d_secure.failed.title');
  return t('subscription.3d_secure.title');
});

/** A server error leaves the charge's outcome unknown, so only the other failures say nothing was charged. */
const descriptionText = computed<string>(() => {
  if (get(serverError))
    return t('subscription.3d_secure.outcome_unknown');
  if (get(failure))
    return t('subscription.3d_secure.nothing_charged');
  return t('subscription.3d_secure.description');
});

const statusMessage = computed<string>(() =>
  get(state) === 'finishing' ? t('subscription.3d_secure.finishing') : t('subscription.3d_secure.connecting'),
);

const total = computed<string | undefined>(() => {
  const payment = get(params);
  return payment ? formatEur(payment.finalAmount) : undefined;
});

async function startProcess(): Promise<void> {
  const result = await initializeProcess();
  if (result.success)
    await navigateTo('/checkout/success');
}

onBeforeMount(async () => {
  await startProcess();
});

onUnmounted(() => {
  cleanup();
});

onBeforeRouteLeave((to, from, next) => {
  cleanup();
  clearStoredData();
  next();
});
</script>

<template>
  <div>
    <PaymentPage
      v-if="params"
      :title="title"
      :total="total"
    >
      <!-- A failure keeps a line here too, so the page does not jump up when it shows. -->
      <template #description>
        {{ descriptionText }}
      </template>

      <ThreeDSecureFailed
        v-if="failure"
        :failure="failure"
        :message="error"
        :retry-href="retryHref"
      />
      <template v-else>
        <div
          v-if="isProcessing && !challengeVisible"
          class="flex flex-col items-center justify-center gap-4 min-h-75 rounded-rui-card border border-rui-divider bg-rui-surface"
          data-cy="three-d-secure-status"
        >
          <RuiProgress
            variant="indeterminate"
            size="48"
            circular
            color="primary"
          />
          <p
            class="text-rui-text-secondary text-center max-w-md"
            aria-live="polite"
          >
            {{ statusMessage }}
          </p>
        </div>
      </template>

      <!-- Braintree mounts the bank's challenge here, so it stays in the DOM while hidden. -->
      <div
        v-show="challengeVisible"
        id="threeds-iframe-container"
        class="w-full flex justify-center rounded-rui-card border border-rui-divider bg-rui-surface p-2 md:p-6 [&>div]:w-full [&_iframe]:w-full [&_iframe]:min-h-150"
        data-cy="three-d-secure-challenge"
      />
      <p
        v-if="challengeVisible && !failure"
        class="text-sm text-rui-text-secondary"
      >
        <i18n-t
          keypath="subscription.3d_secure.cancel"
          tag="span"
        >
          <template #link>
            <ButtonLink
              :to="retryHref"
              inline
              color="primary"
            >
              {{ t('subscription.3d_secure.cancel_link') }}
            </ButtonLink>
          </template>
        </i18n-t>
      </p>

      <template #summary>
        <ThreeDSecureSummary
          :payment="params"
          :failed="!!failure"
        />
      </template>
    </PaymentPage>

    <div
      v-else-if="state !== 'initializing'"
      class="max-w-xl flex flex-col gap-4"
      data-cy="three-d-secure-expired"
    >
      <h1 class="text-2xl md:text-3xl font-semibold text-rui-text">
        {{ title }}
      </h1>
      <p class="text-rui-text-secondary">
        {{ t('subscription.3d_secure.expired.message') }}
      </p>
      <ButtonLink
        to="/checkout/pay"
        variant="default"
        color="primary"
        size="lg"
        class="w-full sm:w-auto"
      >
        {{ t('subscription.3d_secure.expired.action') }}
      </ButtonLink>
    </div>
  </div>

  <ServerErrorOverlay :visible="serverError" />
</template>
