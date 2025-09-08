<script setup lang="ts">
import type { TierKey } from '~/composables/rotki-sponsorship/types';
import { set } from '@vueuse/core';
import { truncateAddress } from '~/utils/text';

defineProps<Props>();
const emit = defineEmits<{
  approve: [type: ApprovalType];
}>();
const APPROVAL_TYPE = { UNLIMITED: 'unlimited', EXACT: 'exact' } as const;

type ApprovalType = typeof APPROVAL_TYPE[keyof typeof APPROVAL_TYPE];

interface Props {
  connected: boolean;
  address?: string;
  isExpectedChain: boolean;
  needsApproval: boolean;
  isApproving: boolean;
  isButtonDisabled: boolean;
  buttonText: string;
  buttonAction: () => void | Promise<void>;
  selectedCurrency: string;
  selectedTier: TierKey;
  sponsorshipStatus: 'idle' | 'pending' | 'success' | 'error';
  getPriceForTier: (currency: string, tier: TierKey) => string | undefined;
  open: () => void;
}

const { t } = useI18n({ useScope: 'global' });

const showApprovalOptions = ref<boolean>(false);

function handleApprove(type: ApprovalType) {
  emit('approve', type);
  set(showApprovalOptions, false);
}
</script>

<template>
  <div class="pt-4">
    <div class="flex gap-1 overflow-hidden">
      <!-- Approval Menu for when approval is needed -->
      <RuiMenu
        v-if="needsApproval && !isApproving"
        v-model="showApprovalOptions"
        :popper="{ placement: 'bottom' }"
        class="w-full"
        wrapper-class="w-full"
      >
        <template #activator="{ attrs }">
          <RuiButton
            color="primary"
            size="lg"
            class="w-full flex-1 [&_span]:!text-wrap"
            :disabled="isButtonDisabled"
            v-bind="attrs"
          >
            {{ t('sponsor.sponsor_page.buttons.approve', { currency: selectedCurrency }) }}
            <template #append>
              <RuiIcon
                name="lu-chevron-down"
                size="16"
              />
            </template>
          </RuiButton>
        </template>
        <template #default="{ width }">
          <div :style="{ width: `${width}px` }">
            <RuiButton
              variant="list"
              @click="handleApprove(APPROVAL_TYPE.UNLIMITED)"
            >
              {{ t('sponsor.sponsor_page.approval.unlimited_button') }}
            </RuiButton>
            <RuiButton
              variant="list"
              @click="handleApprove(APPROVAL_TYPE.EXACT)"
            >
              {{
                t('sponsor.sponsor_page.approval.exact_button', {
                  amount: getPriceForTier(selectedCurrency, selectedTier),
                  currency: selectedCurrency,
                })
              }}
            </RuiButton>
          </div>
        </template>
      </RuiMenu>

      <!-- Loading state while approving -->
      <RuiButton
        v-if="isApproving"
        color="primary"
        size="lg"
        class="w-full flex-1 [&_span]:!text-wrap"
        :loading="true"
        disabled
      >
        {{ t('sponsor.sponsor_page.buttons.approving') }}
      </RuiButton>

      <!-- Regular mint button -->
      <RuiButton
        v-if="!needsApproval && !isApproving"
        color="primary"
        size="lg"
        class="w-full flex-1 [&_span]:!text-wrap"
        :loading="sponsorshipStatus === 'pending'"
        :disabled="isButtonDisabled"
        @click="buttonAction()"
      >
        <template #prepend>
          <RuiIcon
            v-if="connected"
            name="lu-external-link"
          />
          <RuiIcon
            v-else
            name="lu-wallet"
          />
        </template>
        {{ buttonText }}
      </RuiButton>
      <RuiButton
        v-if="connected"
        size="lg"
        color="secondary"
        class="!px-3"
        @click="open()"
      >
        <RuiIcon name="lu-wallet" />
      </RuiButton>
    </div>
    <div
      v-if="connected && address"
      class="text-sm text-rui-text-secondary mt-2"
    >
      {{ t('sponsor.sponsor_page.connected_to', { address: truncateAddress(address) }) }}
    </div>
  </div>
</template>
