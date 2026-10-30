<script setup lang="ts">
import AccountCreditHistoryTable from '~/components/account/home/AccountCreditHistoryTable.vue';
import RefreshButton from '~/components/account/home/RefreshButton.vue';
import { useCredit } from '~/composables/account/use-credit';
import { formatDecimalString } from '~/utils/text';

const { t } = useI18n({ useScope: 'global' });

const historyOpen = ref<boolean>(false);

const { balance, hasHistory, history, initialLoading, load, loading } = useCredit();

function formatEur(value: string): string {
  return t('account.credit.balance_eur', { amount: formatDecimalString(value) });
}

onMounted(load);
</script>

<template>
  <div class="rounded-lg bg-rui-grey-50 dark:bg-rui-grey-900 p-4 md:p-5">
    <div class="flex items-start justify-between gap-2">
      <p class="text-caption font-medium uppercase tracking-wide text-rui-text-secondary">
        {{ t('account.credit.balance') }}
      </p>
      <RefreshButton
        :loading="loading"
        :disabled="initialLoading"
        class="-mt-2 -mr-2"
        @refresh="load()"
      />
    </div>

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
        v-if="hasHistory"
        variant="text"
        color="primary"
        size="sm"
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
