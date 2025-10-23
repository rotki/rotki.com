<script setup lang="ts">
import type { SavedCard } from '@rotki/card-payment-common/schemas/payment';

interface Props {
  card: SavedCard;
  loading?: boolean;
  disabled?: boolean;
  deleting?: boolean;
  selectable?: boolean;
  selected?: boolean;
  hideActions?: boolean;
  deleteDisabled?: boolean;
  deleteTooltip?: string;
  isLinked?: boolean;
  showLinkButton?: boolean;
}

defineProps<Props>();

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
      'cursor-pointer transition-all hover:border-rui-primary': selectable,
      'border-rui-primary bg-rui-primary/5': selectable && selected,
      'border-rui-grey-300': selectable && !selected,
      '!border-2 !border-rui-primary': isLinked && !selectable,
    }"
    @click="selectable ? emit('select', card) : undefined"
  >
    <div class="flex items-center justify-between">
      <div class="flex items-center gap-4">
        <!-- Radio button for selection mode -->
        <RuiRadio
          v-if="selectable"
          color="primary"
          :value="true"
          :model-value="selected"
          hide-details
          @input="emit('select', card)"
        />

        <!-- Card Image -->
        <div class="rounded-md bg-rui-grey-50 h-10 w-14 flex items-center justify-center">
          <img
            :src="card.imageUrl"
            :alt="t('common.card')"
            class="w-full h-full object-contain object-center"
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
          :disabled="!deleteDisabled"
          tooltip-class="max-w-40"
        >
          <template #activator>
            <RuiButton
              icon
              color="error"
              variant="text"
              :loading="deleting"
              :disabled="disabled || deleteDisabled"
              @click="emit('delete')"
            >
              <RuiIcon
                name="lu-trash-2"
                size="20"
              />
            </RuiButton>
          </template>
          {{ deleteTooltip }}
        </RuiTooltip>
      </div>

      <!-- Linked badge in selection mode -->
      <RuiChip
        v-if="selectable && isLinked"
        color="info"
        size="sm"
      >
        {{ t('home.account.payment_methods.linked_card') }}
      </RuiChip>
    </div>
  </RuiCard>
</template>
