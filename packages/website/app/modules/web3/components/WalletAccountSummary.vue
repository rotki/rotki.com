<script setup lang="ts">
import { useClipboard } from '@vueuse/core';
import { get } from '@vueuse/shared';
import AddressAvatar from '~/components/common/AddressAvatar.vue';
import { useEnsName } from '~/modules/web3/composables/use-ens-name';
import { truncateAddress } from '~/modules/web3/core/format';

const { address, ensName } = defineProps<{
  address: string;
  ensName?: string;
  open: () => void;
}>();

const { t } = useI18n({ useScope: 'global' });

const { ensName: resolvedEnsName, loading: ensLoading } = useEnsName(() => address);

const source = computed<string>(() => address);
const { copy, copied, isSupported } = useClipboard({ copiedDuring: 1500, source });

// The `ensName` prop is an explicit override; otherwise use the reverse-resolved name.
const effectiveEnsName = computed<string | undefined>(() => ensName || get(resolvedEnsName));

const display = computed<string>(() => get(effectiveEnsName) || truncateAddress(address));
</script>

<template>
  <div class="flex items-center gap-3 p-2.5 rounded-lg border border-rui-grey-200 dark:border-rui-grey-800 bg-rui-grey-50 dark:bg-rui-grey-900/40">
    <AddressAvatar
      :address="address"
      :ens-name="effectiveEnsName"
    />

    <div class="flex flex-col min-w-0 flex-1">
      <span class="flex items-center gap-1 text-xs text-rui-text-secondary leading-tight">
        {{ t('sponsor.connected_account.label') }}
        <RuiIcon
          v-if="get(ensLoading) && !effectiveEnsName"
          class="animate-spin text-rui-text-disabled"
          name="lu-loader-circle"
          size="12"
          :aria-label="t('sponsor.connected_account.resolving_ens')"
        />
      </span>
      <span class="text-sm font-medium font-mono truncate text-rui-text">
        {{ display }}
      </span>
    </div>

    <RuiTooltip
      v-if="isSupported"
      :open-delay="200"
    >
      <template #activator>
        <RuiButton
          variant="text"
          icon
          size="sm"
          :aria-label="t('sponsor.connected_account.copy_address')"
          @click="copy()"
        >
          <RuiIcon
            :name="copied ? 'lu-check' : 'lu-copy'"
            :color="copied ? 'success' : undefined"
            size="16"
          />
        </RuiButton>
      </template>
      {{ copied ? t('sponsor.connected_account.copied') : t('sponsor.connected_account.copy_address') }}
    </RuiTooltip>

    <RuiButton
      variant="text"
      color="primary"
      size="sm"
      @click="open()"
    >
      {{ t('sponsor.connected_account.change') }}
    </RuiButton>
  </div>
</template>
