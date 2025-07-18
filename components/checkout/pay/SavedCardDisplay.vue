<script setup lang="ts">
import type { SavedCard } from '~/types';
import { get, set } from '@vueuse/core';
import {
  type Client,
  type VaultManager,
  vaultManager,
} from 'braintree-web';
import { usePaymentCardsStore } from '~/store/payments/cards';
import { assert } from '~/utils/assert';

interface ErrorMessage {
  title: string;
  message: string;
}

const props = defineProps<{
  client: Client;
  card: SavedCard;
  disabled: boolean;
}>();

const emit = defineEmits<{
  (e: 'update:error', error: ErrorMessage): void;
  (e: 'update:form-valid', valid: boolean): void;
  (e: 'update:initializing', initializing: boolean): void;
}>();

const { client, card } = toRefs(props);

const deleteLoading = ref(false);
const showDeleteConfirmation = ref(false);
const submitPayload = ref<{ nonce: string; bin: string }>({
  nonce: '',
  bin: '',
});
const payloadError = ref<string>('');

function updateError(error: ErrorMessage) {
  emit('update:error', error);
}

function updateFormValid(valid: boolean) {
  emit('update:form-valid', valid);
}

function updateInitializing(valid: boolean) {
  emit('update:initializing', valid);
}

function setupVaults() {
  let _vaults: VaultManager | null = null;

  const getVaults = () => {
    assert(_vaults);
    return _vaults;
  };

  const create = async (client: Client) => {
    _vaults = await vaultManager.create({
      client,
    });
  };

  const teardown = () => {
    _vaults?.teardown();
  };

  return {
    create,
    get: getVaults,
    focus,
    teardown,
  };
}
const { deleteCard } = usePaymentCardsStore();
const vaults = setupVaults();

const { t } = useI18n({ useScope: 'global' });

const last4Digits = computed<string>(() => `**** **** **** ${props.card.last4}`);

async function checkPaymentMethods() {
  const methods = await vaults.get().fetchPaymentMethods();

  const method = methods.find(({ type, details }) => type === 'CreditCard' && details && 'lastFour' in details && details?.lastFour === get(card).last4);

  if (!method?.details
    || !('bin' in method.details)
    || !('expirationMonth' in method.details)
    || !('expirationYear' in method.details)
  ) {
    set(payloadError, t('home.plans.tiers.step_3.saved_card.cannot_use_card'));
  }
  else {
    const current = new Date();
    const month = current.getMonth() + 1;
    const year = current.getFullYear();
    const expirationMonth = Number(method.details.expirationMonth);
    const expirationYear = Number(method.details.expirationYear);

    if (expirationYear > year || (expirationYear === year && expirationMonth >= month)) {
      const nonce = method.nonce;
      const bin = method.details.bin;

      set(submitPayload, { nonce, bin });
    }
    else {
      set(payloadError, t('home.plans.tiers.step_3.saved_card.card_expired'));
    }
  }
}

function submit() {
  return get(submitPayload);
}

function deleteCardClick() {
  set(showDeleteConfirmation, true);
}

async function handleDeleteCard() {
  set(showDeleteConfirmation, false);
  set(deleteLoading, true);
  await deleteCard(get(card).token);
  set(deleteLoading, false);
}

watchImmediate(payloadError, (payloadError) => {
  updateFormValid(!payloadError);
});

onMounted(async () => {
  try {
    updateInitializing(true);
    await vaults.create(get(client));
    await checkPaymentMethods();
  }
  catch (error_: any) {
    updateError({
      title: t('subscription.error.init_error'),
      message: error_.message,
    });
  }
  finally {
    updateInitializing(false);
  }
});

onUnmounted(() => {
  vaults.teardown();
});

defineExpose({ submit });
</script>

<template>
  <div :class="$style.card">
    <div class="rounded-md bg-rui-grey-50 h-10 w-14 flex items-center justify-center">
      <img
        :src="card.imageUrl"
        alt="Card"
        class="w-full h-full object-contain object-center"
      />
    </div>
    <div class="grow">
      <div>
        {{ last4Digits }}
      </div>
      <div class="text-rui-text-secondary">
        {{ t('home.plans.tiers.step_3.saved_card.expiry', { expiresAt: card.expiresAt }) }}
      </div>
    </div>
    <RuiButton
      icon
      size="lg"
      color="error"
      :disabled="disabled"
      variant="text"
      :loading="deleteLoading"
      @click="deleteCardClick()"
    >
      <RuiIcon name="lu-trash-2" />
    </RuiButton>
  </div>
  <RuiAlert
    v-if="payloadError"
    class="mt-4"
    type="error"
    :description="payloadError"
  />
  <RuiDialog
    v-model="showDeleteConfirmation"
    max-width="500"
  >
    <RuiCard>
      <template #header>
        {{ t('home.plans.tiers.step_3.saved_card.delete.title') }}
      </template>
      {{ t('home.plans.tiers.step_3.saved_card.delete.description') }}
      <div class="flex justify-end gap-4 pt-4">
        <RuiButton
          variant="text"
          color="primary"
          @click="showDeleteConfirmation = false"
        >
          {{ t('actions.cancel') }}
        </RuiButton>
        <RuiButton
          color="error"
          @click="handleDeleteCard()"
        >
          {{ t('actions.confirm') }}
        </RuiButton>
      </div>
    </RuiCard>
  </RuiDialog>
</template>

<style lang="scss" module>
.card {
  @apply p-4 flex items-center gap-4 border rounded-md;
}
</style>
