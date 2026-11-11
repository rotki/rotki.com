<script setup lang="ts">
import type { CheckoutStepId } from '../utils/checkout-flow';
import { computed } from 'vue';
import { useCheckoutMessages } from '../composables/checkout-messages';
import CheckoutStepper from './CheckoutStepper.vue';

const {
  step,
  logoSrc,
  homeHref,
  backHref,
  backTo = 'plans',
  siteUrl = '',
} = defineProps<{
  step: CheckoutStepId;
  logoSrc: string;
  homeHref: string;
  /** The way back in the header; left out where going back makes no sense (3D Secure, success). */
  backHref?: string;
  /** Where the way back leads, which names the link: the plans, or the subscription an upgrade started from. */
  backTo?: 'plans' | 'subscription';
  /** Prefix for the legal links in the footer. The card app is served apart from the site, so it passes the site's origin. */
  siteUrl?: string;
}>();

defineSlots<{
  default: () => any;
}>();

const t = useCheckoutMessages();

const year = new Date().getFullYear();

const backLabel = computed<string>(() => (backTo === 'subscription' ? t('checkout.shell.back_to_subscription') : t('checkout.shell.back_to_plans')));
</script>

<template>
  <div class="min-h-screen flex flex-col bg-rui-surface-sunken">
    <header class="bg-rui-surface border-b border-rui-divider">
      <div class="container mx-auto px-4 h-14 md:h-[4.5rem] grid grid-cols-[1fr_auto] md:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-4">
        <div class="flex items-center gap-3 md:gap-4 min-w-0">
          <a
            :href="homeHref"
            class="shrink-0 flex"
          >
            <img
              :src="logoSrc"
              :alt="t('checkout.shell.home')"
              class="h-8 w-auto"
              height="32"
              width="31"
            />
          </a>
          <span class="flex items-center gap-1.5 text-sm text-rui-text-secondary md:pl-4 md:border-l md:border-rui-divider">
            <svg
              aria-hidden="true"
              class="size-4 shrink-0"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              viewBox="0 0 24 24"
            >
              <rect
                height="10"
                rx="2"
                width="16"
                x="4"
                y="11"
              />
              <path d="M8 11V7a4 4 0 0 1 8 0v4" />
            </svg>
            {{ t('checkout.shell.secure_checkout') }}
          </span>
        </div>
        <CheckoutStepper :current="step" />
        <a
          v-if="backHref"
          :href="backHref"
          class="hidden md:block justify-self-end text-sm text-rui-primary underline-offset-2 hover:underline"
          data-testid="checkout-back-to-plans"
        >
          {{ backLabel }}
        </a>
      </div>
    </header>

    <main class="grow container mx-auto px-4 py-6 md:py-12 flex flex-col">
      <slot />
      <a
        v-if="backHref"
        :href="backHref"
        class="md:hidden self-center mt-6 p-3 text-sm text-rui-primary underline underline-offset-2"
      >
        {{ backLabel }}
      </a>
    </main>

    <footer class="border-t border-rui-divider bg-rui-surface">
      <div class="container mx-auto px-4 py-6 flex flex-col md:flex-row md:items-center md:justify-between gap-3 text-sm text-rui-text-secondary">
        <span>{{ t('checkout.shell.copyright', { year }) }}</span>
        <nav :aria-label="t('checkout.shell.legal')">
          <ul class="flex flex-wrap gap-x-4 gap-y-2">
            <li>
              <a
                :href="`${siteUrl}/impressum`"
                class="hover:text-rui-text"
              >
                {{ t('checkout.shell.imprint') }}
              </a>
            </li>
            <li>
              <a
                :href="`${siteUrl}/privacy-policy`"
                class="hover:text-rui-text"
              >
                {{ t('checkout.shell.privacy') }}
              </a>
            </li>
            <li>
              <a
                :href="`${siteUrl}/tos`"
                class="hover:text-rui-text"
              >
                {{ t('checkout.shell.terms') }}
              </a>
            </li>
            <li>
              <a
                :href="`${siteUrl}/refund-policy`"
                class="hover:text-rui-text"
              >
                {{ t('checkout.shell.refund') }}
              </a>
            </li>
          </ul>
        </nav>
      </div>
    </footer>
  </div>
</template>
