<script setup lang="ts">
import { computed } from 'vue';
import { useCheckoutMessages } from '../composables/checkout-messages';
import { CHECKOUT_METHODS, type CheckoutMethodId, type MethodLinks } from '../utils/checkout-flow';

interface TileView {
  id: CheckoutMethodId;
  title: string;
  renewal: string;
  /** The renewal in two words, for the narrow tiles on phones. */
  renewalShort: string;
  href: string;
  disabled: boolean;
  current: boolean;
}

const { links, current } = defineProps<{
  /** Methods to offer; a method without a link is left out. */
  links: MethodLinks;
  /** The method of the page the buyer is on. */
  current?: CheckoutMethodId;
}>();

const emit = defineEmits<{
  /** The buyer followed a method's link; the navigation itself is not prevented. */
  select: [method: CheckoutMethodId];
}>();

const t = useCheckoutMessages();

function title(id: CheckoutMethodId): string {
  switch (id) {
    case 'card':
      return t('checkout.methods.card');
    case 'paypal':
      return t('checkout.methods.paypal');
    case 'crypto':
      return t('checkout.methods.crypto');
  }
}

function renewal(id: CheckoutMethodId): string {
  switch (id) {
    case 'card':
      return t('checkout.methods.card_renewal');
    case 'paypal':
      return t('checkout.methods.paypal_renewal');
    case 'crypto':
      return t('checkout.methods.crypto_renewal');
  }
}

function renewalShort(id: CheckoutMethodId): string {
  switch (id) {
    case 'card':
      return t('checkout.methods.card_renewal_short');
    case 'paypal':
      return t('checkout.methods.paypal_renewal_short');
    case 'crypto':
      return t('checkout.methods.crypto_renewal_short');
  }
}

const tiles = computed<TileView[]>(() => CHECKOUT_METHODS.flatMap((id) => {
  const link = links[id];
  if (!link)
    return [];
  return [{
    current: id === current,
    disabled: !!link.disabled,
    href: link.href,
    id,
    renewal: renewal(id),
    renewalShort: renewalShort(id),
    title: title(id),
  }];
}));
</script>

<template>
  <nav
    :aria-label="t('checkout.methods.label')"
    class="grid grid-cols-3 gap-2 sm:gap-3"
  >
    <template
      v-for="tile in tiles"
      :key="tile.id"
    >
      <div
        v-if="tile.disabled"
        aria-disabled="true"
        class="min-h-16 sm:min-h-[4.5rem] flex flex-col justify-center gap-0.5 p-3 sm:p-4 rounded-rui-card border border-rui-divider bg-rui-surface-muted cursor-not-allowed"
        data-testid="method-tile"
        :data-key="tile.id"
      >
        <span class="flex items-center gap-2 font-medium text-rui-text-disabled">
          <span
            aria-hidden="true"
            class="size-4 shrink-0 rounded-full border-2 border-rui-outline"
          />
          {{ tile.title }}
        </span>
        <span class="sm:pl-6 text-sm text-rui-text-secondary">
          <span class="sm:hidden">{{ t('checkout.methods.unavailable_short') }}</span>
          <span class="hidden sm:inline">{{ t('checkout.methods.unavailable') }}</span>
        </span>
      </div>
      <a
        v-else
        :href="tile.href"
        :aria-current="tile.current ? 'page' : undefined"
        class="min-h-16 sm:min-h-[4.5rem] flex flex-col justify-center gap-0.5 p-3 sm:p-4 rounded-rui-card bg-rui-surface no-underline transition-colors outline-hidden focus-visible:ring-2 focus-visible:ring-rui-primary focus-visible:ring-offset-2"
        :class="tile.current ? 'border-2 border-rui-primary p-[calc(0.75rem-1px)]! sm:p-[calc(1rem-1px)]!' : 'border border-rui-outline hover:border-rui-primary'"
        data-testid="method-tile"
        :data-key="tile.id"
        @click="emit('select', tile.id)"
      >
        <span
          class="flex items-center gap-2"
          :class="tile.current ? 'font-semibold text-rui-primary' : 'font-medium text-rui-text'"
        >
          <span
            aria-hidden="true"
            class="size-4 shrink-0 rounded-full"
            :class="tile.current ? 'border-[5px] border-rui-primary' : 'border-2 border-rui-neutral-500'"
          />
          {{ tile.title }}
        </span>
        <span class="sm:pl-6 text-sm text-rui-text-secondary whitespace-nowrap">
          <span class="sm:hidden">{{ tile.renewalShort }}</span>
          <span class="hidden sm:inline">{{ tile.renewal }}</span>
        </span>
      </a>
    </template>
  </nav>
</template>
