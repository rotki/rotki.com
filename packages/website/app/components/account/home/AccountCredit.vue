<script setup lang="ts">
import type { DeepReadonly } from 'vue';
import type { CreditEntry } from '~/types/account';
import AccountCreditHistoryTable from '~/components/account/home/AccountCreditHistoryTable.vue';
import { formatDecimalString } from '~/utils/text';

/** The balance and its history, loaded by the page, which also offers the refresh. */
const { balance, history, initialLoading } = defineProps<{
  balance: string;
  history: DeepReadonly<CreditEntry[]>;
  initialLoading: boolean;
}>();

const { t } = useI18n({ useScope: 'global' });

const historyOpen = ref<boolean>(false);

function formatEur(value: string): string {
  return t('account.credit.balance_eur', { amount: formatDecimalString(value) });
}
</script>

<template>
  <div class="rounded-lg bg-rui-grey-50 dark:bg-rui-grey-900 p-4 md:p-5">
    <p class="text-caption font-medium uppercase tracking-wide text-rui-text-secondary">
      {{ t('account.credit.balance') }}
    </p>

    <!-- Same block heights as the loaded panel, so the row does not grow when the balance arrives -->
    <template v-if="initialLoading">
      <div class="h-[38px] flex items-center">
        <RuiSkeletonLoader class="h-8 w-32" />
      </div>
      <div class="mt-2 h-[60px] flex flex-col justify-around">
        <RuiSkeletonLoader class="h-3 w-full" />
        <RuiSkeletonLoader class="h-3 w-full" />
        <RuiSkeletonLoader class="h-3 w-2/3" />
      </div>
      <RuiSkeletonLoader class="mt-3 h-7 w-28" />
    </template>
    <template v-else>
      <p class="text-h4 text-rui-text tabular-nums">
        {{ formatEur(balance) }}
      </p>
      <p class="mt-2 text-caption text-rui-text-secondary text-pretty">
        {{ t('account.credit.disclaimer') }}
      </p>
      <RuiButton
        v-if="history.length > 0"
        variant="text"
        color="primary"
        class="mt-3 -ml-2"
        @click="historyOpen = true"
      >
        {{ t('account.credit.history.title') }}
      </RuiButton>
      <p
        v-else
        class="mt-3 text-caption text-rui-text-secondary"
      >
        {{ t('account.credit.empty_history') }}
      </p>
    </template>

    <RuiDialog
      v-model="historyOpen"
      max-width="760"
    >
      <RuiCard>
        <template #header>
          {{ t('account.credit.history.title') }}
        </template>
        <AccountCreditHistoryTable :rows="history" />
        <div class="flex justify-end pt-4">
          <RuiButton
            variant="text"
            color="primary"
            @click="historyOpen = false"
          >
            {{ t('actions.close') }}
          </RuiButton>
        </div>
      </RuiCard>
    </RuiDialog>
  </div>
</template>
