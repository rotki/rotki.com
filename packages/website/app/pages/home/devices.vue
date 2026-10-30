<script lang="ts" setup>
import { get } from '@vueuse/shared';
import { storeToRefs } from 'pinia';
import AccountSection from '~/components/account/home/AccountSection.vue';
import ApiKeys from '~/components/account/home/ApiKeys.vue';
import UserDevicesTable from '~/components/account/home/UserDevicesTable.vue';
import ButtonLink from '~/components/common/ButtonLink.vue';
import { usePageSeoNoIndex } from '~/composables/use-page-seo';
import { useMainStore } from '~/store';

usePageSeoNoIndex('Devices and API');

definePageMeta({
  auth: true,
  layout: 'account',
});

const { t } = useI18n({ useScope: 'global' });

const { account } = storeToRefs(useMainStore());
const premium = computed<boolean>(() => get(account)?.canUsePremium ?? false);
</script>

<template>
  <div class="space-y-12">
    <ApiKeys v-if="premium" />
    <AccountSection
      v-else
      :title="t('account.api_keys.connect.title')"
    >
      <div class="rounded-lg border border-default p-5 md:p-6 flex flex-col sm:flex-row sm:items-center gap-4">
        <p class="flex-1 text-body-2 text-rui-text-secondary">
          {{ t('account.api_keys.premium_only') }}
        </p>
        <ButtonLink
          to="/checkout/pay"
          color="primary"
          variant="outlined"
          class="self-start sm:self-auto"
        >
          {{ t('account.no_premium.view_all_plans') }}
        </ButtonLink>
      </div>
    </AccountSection>
    <UserDevicesTable />
  </div>
</template>
