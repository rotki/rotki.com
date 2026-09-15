<script setup lang="ts">
import type { TierKey } from '~/modules/web3/sponsorship/types';
import { set } from '@vueuse/shared';
import WalletAccountSummary from '~/modules/web3/components/WalletAccountSummary.vue';

type ApprovalType = 'unlimited' | 'exact';

export interface MintButtonWallet {
  connected: boolean;
  address?: string;
  open: () => void;
}

export interface MintButtonApproval {
  needsApproval: boolean;
  isApproving: boolean;
}

export interface MintButtonAction {
  disabled: boolean;
  text: string;
  run: () => void | Promise<void>;
}

defineProps<{
  wallet: MintButtonWallet;
  approval: MintButtonApproval;
  action: MintButtonAction;
  selectedCurrency: string;
  selectedTier: TierKey;
  sponsorshipStatus: 'idle' | 'pending' | 'success' | 'error';
  getPriceForTier: (currency: string, tier: TierKey) => string | undefined;
}>();

const emit = defineEmits<{
  approve: [type: ApprovalType];
}>();

const APPROVAL_TYPE = { UNLIMITED: 'unlimited', EXACT: 'exact' } as const;

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
        v-if="approval.needsApproval && !approval.isApproving"
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
            :disabled="action.disabled"
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
        v-if="approval.isApproving"
        color="primary"
        size="lg"
        class="w-full flex-1 [&_span]:!text-wrap"
        loading
        disabled
      >
        {{ t('sponsor.sponsor_page.buttons.approving') }}
      </RuiButton>

      <!-- Regular mint button -->
      <RuiButton
        v-if="!approval.needsApproval && !approval.isApproving"
        color="primary"
        size="lg"
        class="w-full flex-1 [&_span]:!text-wrap"
        :loading="sponsorshipStatus === 'pending'"
        :disabled="action.disabled"
        @click="action.run()"
      >
        <template #prepend>
          <RuiIcon
            v-if="wallet.connected"
            name="lu-external-link"
          />
          <RuiIcon
            v-else
            name="lu-wallet"
          />
        </template>
        {{ action.text }}
      </RuiButton>
    </div>
    <WalletAccountSummary
      v-if="wallet.connected && wallet.address"
      class="mt-3"
      :address="wallet.address"
      :open="wallet.open"
    />
  </div>
</template>
