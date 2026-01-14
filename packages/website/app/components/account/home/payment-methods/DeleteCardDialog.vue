<script lang="ts" setup>
import type { SavedCard } from '@rotki/card-payment-common/schemas/payment';
import { get, set } from '@vueuse/core';
import { usePaymentCards } from '~/modules/checkout/composables/use-payment-cards';
import { useLogger } from '~/utils/use-logger';

interface Props {
  card: SavedCard | undefined;
}

interface Emits {
  success: [];
  error: [error: { title: string; message: string }];
}

const showDialog = defineModel<boolean>({ required: true });
const deleting = defineModel<boolean>('deleting', { default: false });

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

const { t } = useI18n({ useScope: 'global' });
const logger = useLogger('delete-card-dialog');

const { deleteCard } = usePaymentCards();

async function handleDeleteCard(): Promise<void> {
  const card = get(props).card;
  if (!card) {
    return;
  }

  try {
    set(deleting, true);
    set(showDialog, false);
    await deleteCard(card.token);
    emit('success');
  }
  catch (error: any) {
    logger.error('Failed to delete card:', error);
    emit('error', {
      title: t('common.error'),
      message: error.message || t('common.error_occurred'),
    });
  }
  finally {
    set(deleting, false);
  }
}

function handleCancel(): void {
  set(showDialog, false);
}
</script>

<template>
  <RuiDialog
    v-model="showDialog"
    max-width="500"
  >
    <RuiCard content-class="!pt-0">
      <template #header>
        {{ t('home.plans.tiers.step_3.saved_card.delete.title') }}
      </template>

      {{ t('home.plans.tiers.step_3.saved_card.delete.description') }}

      <div
        v-if="card"
        class="mt-4 p-3 bg-rui-grey-50 rounded-md flex items-center gap-3"
      >
        <div class="rounded bg-white h-8 w-12 flex items-center justify-center">
          <NuxtImg
            :src="card.imageUrl"
            :alt="t('common.card')"
            class="w-full h-full object-contain object-center"
            width="48"
            height="32"
          />
        </div>
        <div>
          <div class="font-medium text-sm">
            •••• •••• •••• {{ card.last4 }}
          </div>
          <div class="text-xs text-rui-text-secondary">
            {{ t('home.plans.tiers.step_3.saved_card.expiry', { expiresAt: card.expiresAt }) }}
          </div>
        </div>
      </div>

      <template #footer>
        <div class="w-full flex justify-end gap-3">
          <RuiButton
            variant="text"
            :disabled="deleting"
            @click="handleCancel()"
          >
            {{ t('actions.cancel') }}
          </RuiButton>
          <RuiButton
            color="error"
            :loading="deleting"
            @click="handleDeleteCard()"
          >
            {{ t('actions.delete') }}
          </RuiButton>
        </div>
      </template>
    </RuiCard>
  </RuiDialog>
</template>
