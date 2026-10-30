<script setup lang="ts">
import { get } from '@vueuse/shared';
import { storeToRefs } from 'pinia';
import AccountAddress from '~/components/account/home/AccountAddress.vue';
import AccountInformation from '~/components/account/home/AccountInformation.vue';
import AccountSection from '~/components/account/home/AccountSection.vue';
import { useMainStore } from '~/store';

interface DetailRow {
  label: string;
  lines: string[];
}

const { t } = useI18n({ useScope: 'global' });

const { account } = storeToRefs(useMainStore());

const editing = ref<boolean>(false);

/** The country's English name, from the browser, so showing it needs no country list request. */
function countryName(code: string): string {
  if (!code)
    return '';
  try {
    return new Intl.DisplayNames(['en'], { type: 'region' }).of(code) ?? code;
  }
  catch {
    return code;
  }
}

const rows = computed<DetailRow[]>(() => {
  const address = get(account)?.address;
  if (!address)
    return [];

  const name = `${address.firstName} ${address.lastName}`.trim();
  const cityLine = [address.postcode, address.city].filter(Boolean).join(' ');
  return [
    { label: t('account.billing.invoice.name'), lines: name ? [name] : [] },
    { label: t('account.billing.invoice.company'), lines: address.companyName ? [address.companyName] : [] },
    { label: t('account.billing.invoice.vat_id'), lines: address.vatId ? [address.vatId] : [] },
    {
      label: t('account.billing.invoice.address'),
      lines: [address.address1, address.address2, cityLine, countryName(address.country)].filter(Boolean),
    },
  ];
});
</script>

<template>
  <AccountSection
    :title="t('account.billing.invoice.title')"
    :description="t('account.billing.invoice.description')"
  >
    <template #actions>
      <RuiButton
        color="primary"
        variant="outlined"
        :aria-expanded="editing"
        aria-controls="invoice-details-edit"
        @click="editing = !editing"
      >
        {{ editing ? t('actions.close') : t('actions.edit') }}
      </RuiButton>
    </template>

    <div
      v-if="editing"
      id="invoice-details-edit"
      class="space-y-10"
    >
      <div>
        <h3 class="text-subtitle-1 font-medium text-rui-text mb-4">
          {{ t('account.billing.invoice.name_and_vat') }}
        </h3>
        <AccountInformation />
      </div>
      <div>
        <h3 class="text-subtitle-1 font-medium text-rui-text mb-4">
          {{ t('account.billing.invoice.address') }}
        </h3>
        <AccountAddress />
      </div>
    </div>

    <dl
      v-else
      class="rounded-lg border border-default p-4 md:p-6 grid gap-x-8 gap-y-5 sm:grid-cols-2"
    >
      <div
        v-for="row in rows"
        :key="row.label"
      >
        <dt class="text-caption font-medium uppercase tracking-wide text-rui-text-secondary">
          {{ row.label }}
        </dt>
        <dd
          v-if="row.lines.length > 0"
          class="mt-1 text-body-1 text-rui-text"
        >
          <span
            v-for="(line, index) in row.lines"
            :key="index"
            class="block"
          >
            {{ line }}
          </span>
        </dd>
        <dd
          v-else
          class="mt-1 text-body-1 text-rui-text-secondary"
        >
          {{ t('account.billing.invoice.not_set') }}
        </dd>
      </div>
    </dl>
  </AccountSection>
</template>
