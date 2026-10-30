<script setup lang="ts">
import type { SavedCard } from '@rotki/card-payment-common/schemas/payment';

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
  <div
    class="rounded-lg border p-4 md:px-5 flex flex-wrap items-center gap-x-4 gap-y-3 transition-colors"
    :class="{
      'border-default': !selection,
      'cursor-pointer hover:border-rui-primary': !!selection,
      'border-rui-primary bg-rui-primary/5': !!selection?.selected,
      'border-rui-grey-300': !!selection && !selection.selected,
    }"
    @click="selection ? emit('select', card) : undefined"
  >
    <!-- eslint-disable vue/prefer-true-attribute-shorthand -- RuiRadio's value prop is untyped, so the shorthand would pass '' instead of true -->
    <RuiRadio
      v-if="selection"
      color="primary"
      :value="true"
      :model-value="selection.selected"
      hide-details
      @input="emit('select', card)"
    />
    <!-- eslint-enable vue/prefer-true-attribute-shorthand -->

    <div class="shrink-0 rounded-md border border-default bg-white h-9 w-14 flex items-center justify-center overflow-hidden">
      <img
        :src="card.imageUrl"
        :alt="t('common.card')"
        class="w-full h-full object-contain object-center"
        width="56"
        height="36"
      />
    </div>

    <div class="flex-1 min-w-40">
      <p class="text-body-1 font-medium text-rui-text">
        {{ t('home.account.payment_methods.ending_in', { last4: card.last4 }) }}
      </p>
      <p class="text-body-2 text-rui-text-secondary">
        {{ t('home.plans.tiers.step_3.saved_card.expiry', { expiresAt: card.expiresAt }) }}
      </p>
    </div>

    <RuiChip
      v-if="isLinked"
      size="sm"
      variant="tonal"
      color="primary"
    >
      {{ t('home.account.payment_methods.linked_card') }}
    </RuiChip>

    <div
      v-if="!hideActions"
      class="flex items-center gap-1"
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
    </div>
  </div>
</template>
