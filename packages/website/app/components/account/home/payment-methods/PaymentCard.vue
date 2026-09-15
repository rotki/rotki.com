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
  <RuiCard
    :class="{
      'cursor-pointer transition-all hover:border-rui-primary': !!selection,
      'border-rui-primary bg-rui-primary/5': !!selection?.selected,
      'border-rui-grey-300': !!selection && !selection.selected,
      '!border-2 !border-rui-primary': isLinked && !selection,
    }"
    @click="selection ? emit('select', card) : undefined"
  >
    <div class="flex items-center justify-between">
      <div class="flex items-center gap-4">
        <!-- Radio button for selection mode -->
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

        <!-- Card Image -->
        <div class="rounded-md bg-rui-grey-50 h-10 w-14 flex items-center justify-center">
          <img
            :src="card.imageUrl"
            :alt="t('common.card')"
            class="w-full h-full object-contain object-center"
            width="56"
            height="40"
          />
        </div>

        <!-- Card Details -->
        <div>
          <div class="font-medium">
            •••• •••• •••• {{ card.last4 }}
          </div>
          <div class="text-sm text-rui-text-secondary">
            {{ t('home.plans.tiers.step_3.saved_card.expiry', { expiresAt: card.expiresAt }) }}
          </div>
        </div>
      </div>

      <!-- Actions -->
      <div
        v-if="!hideActions"
        class="flex items-center gap-2"
      >
        <!-- Link Card Button - shows if not linked and there's an active subscription -->
        <RuiButton
          v-if="!isLinked && showLinkButton"
          variant="text"
          size="sm"
          :loading="loading"
          :disabled="disabled"
          @click="emit('set-default')"
        >
          {{ t('home.account.payment_methods.link_card') }}
        </RuiButton>

        <!-- Linked Card Badge and Re-authorize Button -->
        <div
          v-if="isLinked"
          class="flex flex-col items-center gap-1"
        >
          <RuiChip
            color="info"
            size="sm"
          >
            {{ t('home.account.payment_methods.linked_card') }}
          </RuiChip>
          <RuiButton
            variant="text"
            size="sm"
            :loading="loading"
            :disabled="disabled"
            @click="emit('reauthorize')"
          >
            {{ t('home.account.payment_methods.reauthorize') }}
          </RuiButton>
        </div>

        <RuiTooltip
          :disabled="!deletion?.disabled"
          tooltip-class="max-w-40"
        >
          <template #activator>
            <RuiButton
              icon
              color="error"
              variant="text"
              :loading="deletion?.deleting"
              :disabled="disabled || deletion?.disabled"
              @click="emit('delete')"
            >
              <RuiIcon
                name="lu-trash-2"
                size="20"
              />
            </RuiButton>
          </template>
          {{ deletion?.tooltip }}
        </RuiTooltip>
      </div>

      <!-- Linked badge in selection mode -->
      <RuiChip
        v-if="selection && isLinked"
        color="info"
        size="sm"
      >
        {{ t('home.account.payment_methods.linked_card') }}
      </RuiChip>
    </div>
  </RuiCard>
</template>
