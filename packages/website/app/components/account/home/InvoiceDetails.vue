<script setup lang="ts">
import { get, set } from '@vueuse/shared';
import { storeToRefs } from 'pinia';
import AccountAddress from '~/components/account/home/AccountAddress.vue';
import AccountInformation from '~/components/account/home/AccountInformation.vue';
import AccountSection from '~/components/account/home/AccountSection.vue';
import FloatingNotification from '~/components/account/home/FloatingNotification.vue';
import { useMainStore } from '~/store';

type EditGroup = 'name' | 'address';

interface DetailRow {
  label: string;
  value: string;
}

const { t } = useI18n({ useScope: 'global' });

const groupTitles: Record<EditGroup, string> = {
  name: t('account.billing.invoice.name_and_vat'),
  address: t('account.billing.invoice.address'),
};

const editing = ref<EditGroup>();
/** The group a jump to the other form came from, to go back to once that form is done. */
const returnTo = ref<EditGroup>();
/** Bumped on every open, so each open starts from the saved values. */
const formsKey = ref<number>(0);
const saved = ref<boolean>(false);

const { account } = storeToRefs(useMainStore());

const dialogOpen = computed<boolean>({
  get: () => get(editing) !== undefined,
  set: (open: boolean) => {
    if (!open) {
      set(editing, undefined);
      set(returnTo, undefined);
    }
  },
});

const dialogTitle = computed<string>(() => {
  const group = get(editing);
  return group ? groupTitles[group] : '';
});

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

const nameRows = computed<DetailRow[]>(() => {
  const address = get(account)?.address;
  if (!address)
    return [];

  const name = `${address.firstName} ${address.lastName}`.trim();
  return [
    { label: t('account.billing.invoice.name'), value: name },
    { label: t('account.billing.invoice.company'), value: address.companyName },
    { label: t('account.billing.invoice.vat_id'), value: address.vatId },
  ];
});

const addressLines = computed<string[]>(() => {
  const address = get(account)?.address;
  if (!address)
    return [];

  const cityLine = [address.postcode, address.city].filter(Boolean).join(' ');
  return [address.address1, address.address2, cityLine, countryName(address.country)].filter(Boolean);
});

function open(group: EditGroup): void {
  set(formsKey, get(formsKey) + 1);
  set(returnTo, undefined);
  set(editing, group);
}

/** Moves to the other form; both stay mounted, so what was typed in the first one is kept. */
function switchTo(group: EditGroup): void {
  set(returnTo, get(editing));
  set(editing, group);
}

/** After a jump, saving or cancelling goes back to the form the user came from. */
function done(): void {
  const back = get(returnTo);
  set(returnTo, undefined);
  set(editing, back);
}

function onSaved(): void {
  set(saved, true);
  done();
}
</script>

<template>
  <AccountSection
    :title="t('account.billing.invoice.title')"
    :description="t('account.billing.invoice.description')"
  >
    <div class="rounded-lg border border-default divide-y divide-default">
      <div class="p-4 md:p-6">
        <div class="flex items-center justify-between gap-4">
          <h3 class="text-subtitle-1 font-medium text-rui-text">
            {{ t('account.billing.invoice.name_and_vat') }}
          </h3>
          <RuiButton
            color="primary"
            variant="text"
            :aria-label="t('account.billing.invoice.change_name')"
            @click="open('name')"
          >
            {{ t('actions.change') }}
          </RuiButton>
        </div>
        <dl class="mt-3 grid gap-x-8 gap-y-4 sm:grid-cols-3">
          <div
            v-for="row in nameRows"
            :key="row.label"
          >
            <dt class="text-caption font-medium uppercase tracking-wide text-rui-text-secondary">
              {{ row.label }}
            </dt>
            <dd
              class="mt-1 text-body-1 break-words"
              :class="row.value ? 'text-rui-text' : 'text-rui-text-secondary'"
            >
              {{ row.value || t('account.billing.invoice.not_set') }}
            </dd>
          </div>
        </dl>
      </div>

      <div class="p-4 md:p-6">
        <div class="flex items-center justify-between gap-4">
          <h3 class="text-subtitle-1 font-medium text-rui-text">
            {{ t('account.billing.invoice.address') }}
          </h3>
          <RuiButton
            color="primary"
            variant="text"
            :aria-label="t('account.billing.invoice.change_address')"
            @click="open('address')"
          >
            {{ t('actions.change') }}
          </RuiButton>
        </div>
        <p
          v-if="addressLines.length > 0"
          class="mt-3 text-body-1 text-rui-text"
        >
          <span
            v-for="(line, index) in addressLines"
            :key="index"
            class="block"
          >
            {{ line }}
          </span>
        </p>
        <p
          v-else
          class="mt-3 text-body-1 text-rui-text-secondary"
        >
          {{ t('account.billing.invoice.not_set') }}
        </p>
      </div>
    </div>

    <RuiDialog
      v-model="dialogOpen"
      max-width="560"
    >
      <RuiCard>
        <template #header>
          {{ dialogTitle }}
        </template>
        <div :key="formsKey">
          <div v-show="editing === 'name'">
            <AccountInformation
              @saved="onSaved()"
              @cancel="done()"
              @edit-address="switchTo('address')"
            />
          </div>
          <div v-show="editing === 'address'">
            <AccountAddress
              @saved="onSaved()"
              @cancel="done()"
              @edit-name="switchTo('name')"
            />
          </div>
        </div>
      </RuiCard>
    </RuiDialog>

    <FloatingNotification
      type="success"
      closeable
      :visible="saved"
      :timeout="3000"
      @dismiss="saved = false"
    >
      {{ t('notifications.changes_saved') }}
    </FloatingNotification>
  </AccountSection>
</template>
