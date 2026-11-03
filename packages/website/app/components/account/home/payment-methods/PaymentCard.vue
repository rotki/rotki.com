<script setup lang="ts">
import type { SavedCard } from '@rotki/card-payment-common/schemas/payment';
import PaymentCardLayout from '~/components/account/home/payment-methods/PaymentCardLayout.vue';

/** Passed when the card is rendered as an option in a card picker. */
export interface PaymentCardSelection {
  selected?: boolean;
}

export interface PaymentCardDeletion {
  deleting?: boolean;
  disabled?: boolean;
  tooltip?: string;
}

defineProps<{
  card: SavedCard;
  loading?: boolean;
  disabled?: boolean;
  selection?: PaymentCardSelection;
  hideActions?: boolean;
  deletion?: PaymentCardDeletion;
  isLinked?: boolean;
  showLinkButton?: boolean;
}>();

const emit = defineEmits<{
  'set-default': [];
  'reauthorize': [];
  'delete': [];
  'select': [card: SavedCard];
}>();

const { t } = useI18n();
</script>

<template>
  <PaymentCardLayout
    class="transition-colors"
    :class="{
      'border-default': !selection,
      'cursor-pointer hover:border-rui-primary': !!selection,
      'border-rui-primary bg-rui-primary/5': !!selection?.selected,
      'border-rui-grey-300': !!selection && !selection.selected,
    }"
    @click="selection ? emit('select', card) : undefined"
  >
    <template
      v-if="selection"
      #leading
    >
      <!-- eslint-disable vue/prefer-true-attribute-shorthand -- RuiRadio's value prop is untyped, so the shorthand would pass '' instead of true -->
      <RuiRadio
        color="primary"
        :value="true"
        :model-value="selection.selected"
        hide-details
        @input="emit('select', card)"
      />
      <!-- eslint-enable vue/prefer-true-attribute-shorthand -->
    </template>

    <template #logo>
      <div class="size-full rounded-md border border-default bg-white flex items-center justify-center">
        <img
          :src="card.imageUrl"
          :alt="t('common.card')"
          class="w-full h-full object-contain object-center"
          width="56"
          height="36"
        />
      </div>
    </template>

    <template #title>
      {{ t('home.account.payment_methods.ending_in', { last4: card.last4 }) }}
    </template>
    <template #subtitle>
      {{ t('home.plans.tiers.step_3.saved_card.expiry', { expiresAt: card.expiresAt }) }}
    </template>

    <template
      v-if="isLinked"
      #badge
    >
      <RuiChip
        size="sm"
        variant="tonal"
        color="primary"
      >
        {{ t('home.account.payment_methods.linked_card') }}
      </RuiChip>
    </template>

    <template
      v-if="!hideActions"
      #actions
    >
      <RuiButton
        v-if="!isLinked && showLinkButton"
        variant="text"
        color="primary"
        :loading="loading"
        :disabled="disabled"
        @click="emit('set-default')"
      >
        {{ t('home.account.payment_methods.link_card') }}
      </RuiButton>
      <RuiButton
        v-if="isLinked"
        variant="text"
        color="primary"
        :loading="loading"
        :disabled="disabled"
        @click="emit('reauthorize')"
      >
        {{ t('home.account.payment_methods.reauthorize') }}
      </RuiButton>

      <RuiTooltip
        :disabled="!deletion?.disabled"
        :class-names="{ tooltip: 'max-w-40' }"
      >
        <template #activator>
          <RuiButton
            icon
            color="error"
            variant="text"
            :aria-label="t('home.account.payment_methods.remove_card', { last4: card.last4 })"
            :loading="deletion?.deleting"
            :disabled="disabled || deletion?.disabled"
            @click="emit('delete')"
          >
            <RuiIcon
              name="lu-trash-2"
              size="18"
            />
          </RuiButton>
        </template>
        {{ deletion?.tooltip }}
      </RuiTooltip>
    </template>
  </PaymentCardLayout>
</template>
